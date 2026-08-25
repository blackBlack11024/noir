import { ParticleSystem } from './ParticleSystem';
import { ProjectileManager } from './Projectile';
import { AudioManager } from '../core/AudioManager';

export type ObstacleType = 'barrel' | 'explosive_barrel' | 'pillar' | 'sandbag' | 'statue';

export class Obstacle {
  public x: number;
  public y: number;
  public radius: number;
  public type: ObstacleType;
  public hp: number;
  public maxHp: number;
  public isDead: boolean = false;

  constructor(type: ObstacleType, x: number, y: number, customRadius?: number) {
    this.type = type;
    this.x = x;
    this.y = y;

    if (type === 'barrel') {
      this.radius = customRadius || 18;
      this.hp = 35;
      this.maxHp = 35;
    } else if (type === 'explosive_barrel') {
      this.radius = customRadius || 18;
      this.hp = 20;
      this.maxHp = 20;
    } else if (type === 'sandbag') {
      this.radius = customRadius || 20;
      this.hp = 90;
      this.maxHp = 90;
    } else if (type === 'statue') {
      this.radius = customRadius || 28;
      this.hp = 9999;
      this.maxHp = 9999;
    } else {
      // pillar (indestructible steel column)
      this.radius = customRadius || 26;
      this.hp = 9999;
      this.maxHp = 9999;
    }
  }

  public takeDamage(amount: number, particles: ParticleSystem, projectiles: ProjectileManager, player?: any): boolean {
    if (this.isDead) return false;

    if (this.type === 'pillar' || this.type === 'statue') {
      particles.spawnElectricSparks(this.x, this.y, 5);
      AudioManager.playHit();
      return false;
    }

    this.hp -= amount;
    particles.spawnBlood(this.x, this.y, 2); // 碎片反饋
    AudioManager.playHit();

    if (this.hp <= 0) {
      this.isDead = true;
      this.destroy(particles, projectiles, player);
      return true;
    }
    return false;
  }

  private destroy(particles: ParticleSystem, projectiles: ProjectileManager, player?: any) {
    if (this.type === 'barrel') {
      AudioManager.playExplosion();
      particles.spawnSmoke(this.x, this.y, 12, 'rgba(139, 69, 19, 0.6)');
      if (Math.random() < 0.5) {
        particles.spawnCashSparkle(this.x, this.y);
      }
    } else if (this.type === 'explosive_barrel') {
      AudioManager.playExplosion();
      particles.spawnExplosion(this.x, this.y);

      // TNT 瞬間近距離劇烈爆炸對玩家造成傷害與擊退
      if (player && !player.isDead) {
        const pdx = player.x - this.x;
        const pdy = player.y - this.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < 92) {
          player.takeDamage(32, particles);
          const safeDist = Math.max(1, pdist);
          player.x += (pdx / safeDist) * 45;
          player.y += (pdy / safeDist) * 45;
        }
      }

      // 產生高傷火海與爆炸
      projectiles.spawnHazardArea(this.x, this.y, 85, 3.0, 50, 'rgba(255, 69, 0, 0.65)', 'burn');
    } else if (this.type === 'sandbag') {
      AudioManager.playHit();
      particles.spawnSmoke(this.x, this.y, 10, 'rgba(180, 160, 120, 0.6)');
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (this.isDead) return;

    const px = this.x + offsetX;
    const py = this.y + offsetY;

    ctx.save();
    ctx.translate(px, py);

    if (this.type === 'barrel') {
      // 復古橡木私酒桶
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // 金屬鐵箍與木紋
      ctx.strokeStyle = '#2b1d0c';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // 頂部木塞
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'explosive_barrel') {
      // 危險炸藥桶 (暗紅警示 + 金色骷髏/火焰印記)
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 0, 0);

    } else if (this.type === 'pillar') {
      // 鉚釘鋼柱 (Art Deco 碳鋼立柱)
      ctx.fillStyle = '#1e222d';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
      ctx.stroke();

    } else if (this.type === 'sandbag') {
      // 戰術防爆沙袋
      ctx.fillStyle = '#8b7d6b';
      ctx.beginPath();
      ctx.roundRect(-this.radius, -this.radius * 0.7, this.radius * 2, this.radius * 1.4, 6);
      ctx.fill();

      ctx.strokeStyle = '#5c5042';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.5, -this.radius * 0.6);
      ctx.lineTo(this.radius * 0.5, this.radius * 0.6);
      ctx.stroke();

    } else if (this.type === 'statue') {
      // 黑色大理石雅典娜/天使神像
      ctx.fillStyle = '#222831';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏛️', 0, 0);
    }

    ctx.restore();

    // 破損血條 (木桶、炸藥桶與沙袋受損時顯示)
    if (this.type !== 'pillar' && this.type !== 'statue' && this.hp < this.maxHp) {
      ctx.save();
      const barW = 28;
      const barH = 3.5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(px - barW / 2, py - this.radius - 8, barW, barH);
      ctx.fillStyle = this.type === 'explosive_barrel' ? '#ff3333' : '#d4af37';
      ctx.fillRect(px - barW / 2, py - this.radius - 8, barW * (this.hp / this.maxHp), barH);
      ctx.restore();
    }
  }
}

