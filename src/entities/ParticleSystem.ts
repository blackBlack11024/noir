export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'circle' | 'rect' | 'smoke' | 'spark';
}

export interface SmokeCloud {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface DamageNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public smokeClouds: SmokeCloud[] = [];
  public damageNumbers: DamageNumber[] = [];

  public update(dt: number) {
    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 更新戰術煙霧遮蔽雲團
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const s = this.smokeClouds[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.smokeClouds.splice(i, 1);
      }
    }

    // 更新傷害飄字
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y -= 25 * dt;
      d.life -= dt;
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    // 渲染粒子
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      const px = p.x + offsetX;
      const py = p.y + offsetY;

      if (p.shape === 'circle' || p.shape === 'smoke') {
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    // 渲染傷害飄字
    for (const d of this.damageNumbers) {
      const alpha = Math.max(0, d.life / d.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.font = 'bold ' + Math.floor(14 * d.scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(d.text, d.x + offsetX, d.y + offsetY);
      ctx.restore();
    }
  }

  public spawnBlood(x: number, y: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        color: '#8b0000',
        size: 2 + Math.random() * 3,
        shape: 'circle'
      });
    }
  }

  public spawnMuzzleFlash(x: number, y: number, angle: number, color: string = '#ffd700') {
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const speed = 120 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        life: 0.08 + Math.random() * 0.06,
        maxLife: 0.14,
        color: color,
        size: 3 + Math.random() * 2,
        shape: 'spark'
      });
    }
  }

  public spawnSmoke(x: number, y: number, count: number = 8, color: string = 'rgba(150,150,150,0.5)', customRadius: number = 60, duration: number = 1.2, spawnTacticalCloud: boolean = false) {
    if (spawnTacticalCloud) {
      this.smokeClouds.push({
        x,
        y,
        radius: customRadius,
        life: duration,
        maxLife: duration,
        color
      });
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.22 + Math.random() * 0.16, // 快速消散 (0.22 ~ 0.38 秒)
        maxLife: 0.38,
        color: color,
        size: 4 + Math.random() * 5,
        shape: 'smoke'
      });
    }
  }

  public spawnExplosion(x: number, y: number) {
    this.spawnSmoke(x, y, 20, 'rgba(80,80,80,0.7)');
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.6,
        color: Math.random() > 0.4 ? '#ff4500' : '#ffd700',
        size: 4 + Math.random() * 4,
        shape: 'spark'
      });
    }
  }

  public spawnCashSparkle(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color: '#2ecc71',
        size: 3,
        shape: 'rect'
      });
    }
  }

  public spawnElectricSparks(x: number, y: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.15 + Math.random() * 0.15,
        maxLife: 0.3,
        color: '#00e5ff',
        size: 2.5,
        shape: 'spark'
      });
    }
  }

  public spawnIceCrystals(x: number, y: number, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        color: '#80d8ff',
        size: 3 + Math.random() * 3,
        shape: 'rect'
      });
    }
  }

  public addDamageText(x: number, y: number, text: string, color: string = '#ffffff', isCrit: boolean = false) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      text,
      color,
      life: 0.8,
      maxLife: 0.8,
      scale: isCrit ? 1.4 : 1.0
    });
  }
}
