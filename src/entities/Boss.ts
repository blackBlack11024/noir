import { BOSS_DATABASE, BossInfo, BossMove } from '../data/BossDatabase';
import { WEAPON_DATABASE, WeaponInfo } from '../data/WeaponDatabase';
import { Player } from './Player';
import { ProjectileManager } from './Projectile';
import { ParticleSystem } from './ParticleSystem';
import { AudioManager } from '../core/AudioManager';

export interface BossTelegraph {
  type: 'circle' | 'line' | 'sector' | 'cross';
  x: number;
  y: number;
  angle: number;
  radius: number;
  length: number;
  width: number;
}

export class Boss {
  public x: number = 270;
  public y: number = 220;
  public radius: number = 16.5; // 人形黑幫頭目體型，只比玩家 (14px) 略大一點點
  public info: BossInfo;
  public weapon: WeaponInfo;
  public tier: 1 | 2 | 3 | 4 = 1;
  public loopCount: number = 1;
  public speed: number = 95;

  public hp: number;
  public maxHp: number;
  public armor: number = 0;
  public maxArmor: number = 0;

  public state: 'chase' | 'windup' | 'attack' | 'rush' = 'chase';
  public currentMove: BossMove | null = null;
  public windupTimer: number = 0;
  public maxWindupTime: number = 1.0;
  public actionCooldown: number = 1.5;
  public facingAngle: number = 0;

  public isEnraged: boolean = false;
  public isDead: boolean = false;
  public hitFlashTimer: number = 0;
  public pendingMinionSpawns: number = 0;
  public activeTelegraph: BossTelegraph | null = null;

  private rushVx: number = 0;
  private rushVy: number = 0;
  private rushTimer: number = 0;

  constructor(bossId: number, tier: 1 | 2 | 3 | 4 = 1, loopCount: number = 1) {
    this.info = BOSS_DATABASE[bossId] || BOSS_DATABASE[1];
    this.weapon = WEAPON_DATABASE[this.info.weaponRewardId] || WEAPON_DATABASE[bossId] || WEAPON_DATABASE[1];
    this.tier = tier;
    this.loopCount = loopCount;

    // 依據 Tier 與輪迴數動態演化數值 (大幅增強血量與護甲)
    const mults = { 1: 950, 2: 1800, 3: 3200, 4: 5200 };
    const loopHpMult = 1 + (loopCount - 1) * 0.55;
    this.hp = Math.round(mults[tier] * loopHpMult);
    this.maxHp = this.hp;

    const baseArmor = tier === 4 ? 1000 : (tier === 3 ? 650 : (tier === 2 ? 350 : 150));
    this.armor = Math.round(baseArmor * (1 + (loopCount - 1) * 0.35));
    this.maxArmor = this.armor;
  }

  public update(dt: number, player: Player, projectiles: ProjectileManager, particles: ParticleSystem) {
    if (this.isDead) return;

    if (this.actionCooldown > 0) this.actionCooldown -= dt;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // 狂暴階段判定 (HP < 50%)
    if (!this.isEnraged && this.hp < this.maxHp * 0.5) {
      this.isEnraged = true;
      this.speed = 155;
      particles.spawnExplosion(this.x, this.y);
      particles.addDamageText(this.x, this.y, '狂暴覺醒 (ENRAGED)', '#ff3333', true);
      AudioManager.playExplosion();
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.facingAngle = Math.atan2(dy, dx);

    if (this.state === 'rush') {
      // 衝刺狀態位移
      this.x += this.rushVx * dt;
      this.y += this.rushVy * dt;
      this.rushTimer -= dt;

      particles.spawnSmoke(this.x, this.y, 2);

      // 撞擊玩家判定
      if (dist < this.radius + player.radius) {
        player.takeDamage(35 * (1 + (this.loopCount - 1) * 0.2), particles, this.x, this.y);
      }

      if (this.rushTimer <= 0) {
        this.state = 'chase';
        this.actionCooldown = this.isEnraged ? 0.45 : 0.85;
      }
    } else if (this.state === 'chase') {
      // 主動走位與逼近玩家
      if (dist > 75) {
        this.x += Math.cos(this.facingAngle) * this.speed * dt;
        this.y += Math.sin(this.facingAngle) * this.speed * dt;
      }

      if (this.actionCooldown <= 0) {
        this.selectNextMove(player);
      }
    } else if (this.state === 'windup') {
      // 前搖蓄力 (更新預警指示器方向)
      this.windupTimer -= dt;
      if (this.activeTelegraph) {
        this.activeTelegraph.x = this.x;
        this.activeTelegraph.y = this.y;
        this.activeTelegraph.angle = this.facingAngle;
      }
      if (this.windupTimer <= 0 && this.currentMove) {
        this.executeMove(this.currentMove, player, this.facingAngle, projectiles, particles);
      }
    }

    this.clampPosition();
  }

  private selectNextMove(player: Player) {
    const moves = this.info.tierMoves[this.tier] || this.info.tierMoves[1];
    const pick = moves[Math.floor(Math.random() * moves.length)];
    this.currentMove = pick;
    this.state = 'windup';
    const loopWindupMod = Math.max(0.55, Math.pow(0.85, this.loopCount - 1));
    this.windupTimer = pick.windupTime * 0.75 * (this.isEnraged ? 0.60 : 1.0) * loopWindupMod;
    this.maxWindupTime = this.windupTimer;

    // 建立地面危險紅光預警 (Telegraph)
    if (pick.type === 'slam') {
      this.activeTelegraph = { type: 'circle', x: this.x, y: this.y, angle: 0, radius: 120, length: 0, width: 0 };
    } else if (pick.type === 'rush') {
      this.activeTelegraph = { type: 'line', x: this.x, y: this.y, angle: this.facingAngle, radius: 0, length: 320, width: 60 };
    } else if (pick.type === 'laser') {
      this.activeTelegraph = { type: 'line', x: this.x, y: this.y, angle: this.facingAngle, radius: 0, length: 450, width: 24 };
    } else if (pick.type === 'whirlwind' || pick.type === 'bullet_hell') {
      this.activeTelegraph = { type: 'circle', x: this.x, y: this.y, angle: 0, radius: 150, length: 0, width: 0 };
    } else {
      this.activeTelegraph = { type: 'circle', x: this.x, y: this.y, angle: 0, radius: 80, length: 0, width: 0 };
    }
  }

  private executeMove(move: BossMove, player: Player, angle: number, projectiles: ProjectileManager, particles: ParticleSystem) {
    AudioManager.playExplosion();
    this.activeTelegraph = null;
    const dmg = move.damage * (1 + (this.loopCount - 1) * 0.25);

    if (move.type === 'rush') {
      this.state = 'rush';
      this.rushVx = Math.cos(angle) * 520;
      this.rushVy = Math.sin(angle) * 520;
      this.rushTimer = 0.45;
      particles.spawnExplosion(this.x, this.y);
      return;
    }

    const wid = this.weapon.id;
    const isMelee = (this.weapon.category === 'melee' || (this.weapon.category === 'heavy' && this.weapon.maxAmmo === 0));

    if (isMelee) {
      if (move.type === 'slam') {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 260, dmg, false, this.weapon.color, true);
        }
        projectiles.spawnHazardArea(this.x, this.y, 60, 2.5, dmg * 0.4, 'rgba(255, 69, 0, 0.4)', 'burn');
        particles.spawnExplosion(this.x, this.y);
      } else {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 320, dmg * 0.7, false, this.weapon.color, true);
        }
        particles.spawnExplosion(this.x, this.y);
      }
    } else {
      switch (wid) {
        case 4: { // 雙管霰彈
          AudioManager.playShot('shotgun');
          for (let i = -4; i <= 4; i++) {
            projectiles.spawnBullet(this.x, this.y, angle + i * 0.12, 420, dmg * 0.25, false, '#ff5722', true, 1, undefined, 'shotgun_pellet');
          }
          break;
        }
        case 6: { // 化學噴火槍
          AudioManager.playShot('shotgun');
          for (let i = -3; i <= 3; i++) {
            projectiles.spawnBullet(this.x, this.y, angle + i * 0.08, 380, dmg * 0.3, false, '#ff3d00', true, 1, 'burn', 'flame');
          }
          projectiles.spawnHazardArea(this.x + Math.cos(angle) * 70, this.y + Math.sin(angle) * 70, 45, 2.5, dmg * 0.35, 'rgba(255, 69, 0, 0.5)', 'burn');
          break;
        }
        case 13: { // 栓動狙擊步槍
          AudioManager.playShot('revolver');
          projectiles.spawnBullet(this.x, this.y, angle, 900, dmg * 1.5, false, '#00ffff', true, 3, undefined, 'sniper_beam');
          particles.spawnSmoke(this.x, this.y, 10, 'rgba(0, 255, 255, 0.5)');
          break;
        }
        case 18: { // 冷凍噴槍
          AudioManager.playShot('shotgun');
          for (let i = -3; i <= 3; i++) {
            projectiles.spawnBullet(this.x, this.y, angle + i * 0.1, 400, dmg * 0.3, false, '#00e5ff', true, 1, 'freeze', 'frost');
          }
          break;
        }
        case 19: { // 加特林機槍
          AudioManager.playShot('tommy');
          for (let i = -2; i <= 2; i++) {
            projectiles.spawnBullet(this.x, this.y, angle + i * 0.08, 520, dmg * 0.35, false, '#90a4ae', false, 1, undefined, 'bullet');
          }
          break;
        }
        case 22: { // 毒氣榴彈
          AudioManager.playShot('shotgun');
          projectiles.spawnBullet(this.x, this.y, angle, 350, dmg, false, '#00e676', true, 1, 'bleed', 'grenade');
          projectiles.spawnHazardArea(this.x + Math.cos(angle) * 80, this.y + Math.sin(angle) * 80, 50, 3.0, dmg * 0.3, 'rgba(46, 204, 113, 0.45)', 'bleed');
          break;
        }
        case 12: { // 炸藥桶與燃燒瓶
          AudioManager.playShot('shotgun');
          projectiles.spawnBullet(this.x, this.y, angle, 320, dmg, false, '#ff1744', true, 1, 'burn', 'dynamite');
          break;
        }
        case 8:
        case 20: { // 湯姆森 / 雙持短衝
          AudioManager.playShot('tommy');
          for (let i = -2; i <= 2; i++) {
            projectiles.spawnBullet(this.x, this.y, angle + i * 0.1, 500, dmg * 0.4, false, this.weapon.color, false, 1, undefined, 'bullet');
          }
          break;
        }
        default: { // 左輪與其他槍械
          AudioManager.playShot('revolver');
          for (let i = -1; i <= 1; i++) {
            projectiles.spawnBullet(this.x, this.y, angle + i * 0.08, 560, dmg * 0.45, false, this.weapon.color, true, 1, undefined, 'bullet');
          }
          break;
        }
      }
    }

    if (move.type === 'bullet_hell') {
      const count = this.isEnraged ? 24 : 16;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        projectiles.spawnBullet(this.x, this.y, a, 260, dmg * 0.5, false, this.weapon.color);
      }
    } else if (move.type === 'spawn_minions') {
      this.pendingMinionSpawns += this.isEnraged ? 3 : 2;
      particles.spawnSmoke(this.x, this.y, 30);
      particles.addDamageText(this.x, this.y, '呼叫黑道打手', '#ffd700', true);
    } else if (move.type === 'smoke_teleport') {
      particles.spawnSmoke(this.x, this.y, 35);
      const tpAngle = Math.random() * Math.PI * 2;
      this.x = Math.max(60, Math.min(480, player.x + Math.cos(tpAngle) * 140));
      this.y = Math.max(120, Math.min(820, player.y + Math.sin(tpAngle) * 140));
      particles.spawnSmoke(this.x, this.y, 35);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        projectiles.spawnBullet(this.x, this.y, a, 280, dmg * 0.6, false, '#8e44ad');
      }
    }

    this.state = 'chase';
    this.actionCooldown = this.isEnraged ? 0.75 : 1.4;
  }

  public takeDamage(amount: number, particles: ParticleSystem) {
    this.hitFlashTimer = 0.05;
    if (this.armor > 0) {
      this.armor -= amount;
      AudioManager.playHit();
      particles.addDamageText(this.x, this.y, '破甲 ' + Math.round(amount), '#4682b4');
      return;
    }

    this.hp -= amount;
    AudioManager.playHit();
    particles.spawnBlood(this.x, this.y, 6);
    particles.addDamageText(this.x, this.y, Math.round(amount).toString(), '#ffcc00', true);

    if (this.hp <= 0) {
      this.isDead = true;
      particles.spawnExplosion(this.x, this.y);
    }
  }

  private clampPosition() {
    this.x = Math.max(40, Math.min(500, this.x));
    this.y = Math.max(80, Math.min(880, this.y));
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (this.isDead) return;
    const px = this.x + offsetX;
    const py = this.y + offsetY;

    // 1. 地面紅光蓄力危險預警 (Telegraph)
    if (this.activeTelegraph && this.state === 'windup') {
      ctx.save();
      const progress = 1 - Math.max(0, this.windupTimer / (this.maxWindupTime || 1));
      const tel = this.activeTelegraph;

      if (tel.type === 'circle') {
        ctx.fillStyle = 'rgba(255, 30, 30, 0.18)';
        ctx.beginPath();
        ctx.arc(px, py, tel.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(px, py, tel.radius * progress, 0, Math.PI * 2);
        ctx.fill();
      } else if (tel.type === 'line') {
        ctx.translate(px, py);
        ctx.rotate(tel.angle);

        ctx.fillStyle = 'rgba(255, 30, 30, 0.15)';
        ctx.fillRect(0, -tel.width / 2, tel.length, tel.width);

        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -tel.width / 2, tel.length, tel.width);

        ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
        ctx.fillRect(0, -tel.width / 2, tel.length * progress, tel.width);
        ctx.restore();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(px, py);

    // 狂暴紅光外環
    if (this.isEnraged) {
      ctx.strokeStyle = 'rgba(255, 69, 0, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 前搖警示驚嘆號
    if (this.state === 'windup') {
      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -28);
    }

    // 旋轉朝向玩家
    ctx.rotate(this.facingAngle);

    // Boss 人形黑幫大衣本體
    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = this.info.color;
    }
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = (this.hitFlashTimer > 0) ? '#ffffff' : (this.isEnraged ? '#ff4500' : '#ffd700');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 黑幫領袖軟呢禮帽
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(3, -9, 13, 18);

    // 實體武器握持造型 (渲染 BOSS 專屬掉落神兵)
    this.renderBossWeapon(ctx, this.weapon);

    ctx.restore();

    // 頭目頭頂護甲條
    if (this.armor > 0) {
      ctx.save();
      const barW = 55;
      const barH = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(px - barW / 2, py - this.radius - 12, barW, barH);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(px - barW / 2, py - this.radius - 12, barW * (this.armor / (this.maxArmor || 1)), barH);
      ctx.restore();
    }
  }

  // 渲染 BOSS 專屬掉落神兵
  private renderBossWeapon(ctx: CanvasRenderingContext2D, weapon: WeaponInfo) {
    ctx.fillStyle = weapon.color;

    switch (weapon.id) {
      case 1: // 仕紳手杖劍
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(8, 2, 4, 10);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(12, 5, 26, 2.5);
        break;
      case 2: // 工頭破拆鎚
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(8, 2, 22, 3);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(26, -4, 14, 15);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.strokeRect(26, -4, 14, 15);
        break;
      case 3: // 改裝雙動左輪
      case 23:
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(8, 4, 14, 4);
        ctx.fillStyle = '#424242';
        ctx.fillRect(10, 2, 5, 8);
        break;
      case 4: // 雙管霰彈槍
        ctx.fillStyle = '#37474f';
        ctx.fillRect(8, 3, 18, 6);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(6, 6, 6, 6);
        break;
      case 5: // 黑曜彈簧跳刀
        ctx.fillStyle = '#212121';
        ctx.fillRect(10, -8, 14, 3);
        ctx.fillRect(10, 8, 14, 3);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(16, -9, 8, 2);
        ctx.fillRect(16, 9, 8, 2);
        break;
      case 6: // 化學噴火槍
        ctx.fillStyle = '#d84315';
        ctx.fillRect(6, 2, 22, 6);
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(28, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 7: // 刺刀卡賓步槍
      case 13: // 栓動狙擊
        ctx.fillStyle = '#455a64';
        ctx.fillRect(8, 4, 28, 3);
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(36, 4);
        ctx.lineTo(44, 5);
        ctx.lineTo(36, 6);
        ctx.fill();
        break;
      case 8:
      case 20: // 湯姆森衝鋒槍
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(8, 3, 16, 5);
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(14, 11, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 9: // 防暴鋼盾警棍
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(8, -12, 5, 24);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, -12, 5, 24);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(12, 6, 14, 3);
        break;
      case 10: // 重型戰術十字弩
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(6, 4, 18, 3);
        ctx.strokeStyle = '#a1887f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, -10);
        ctx.lineTo(20, 5);
        ctx.lineTo(18, 20);
        ctx.stroke();
        break;
      case 11: // 格鬥精鋼指虎
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(12, -7, 6, 6);
        ctx.fillRect(12, 5, 6, 6);
        break;
      case 12: // 炸藥桶與燃燒瓶
        ctx.fillStyle = '#c62828';
        ctx.fillRect(10, 2, 14, 6);
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(24, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 15: // 屠夫砍刀
        ctx.fillStyle = '#78909c';
        ctx.fillRect(10, 0, 20, 10);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(10, 8, 20, 2);
        break;
      case 18: // 冷凍噴槍
        ctx.fillStyle = '#0288d1';
        ctx.fillRect(6, 2, 20, 7);
        break;
      case 19: // 加特林
        ctx.fillStyle = '#37474f';
        ctx.fillRect(6, 1, 22, 9);
        break;
      case 22: // 毒氣榴彈
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(6, 2, 16, 7);
        break;
      default:
        ctx.fillRect(8, 3, 14, 4);
        break;
    }
  }
}

