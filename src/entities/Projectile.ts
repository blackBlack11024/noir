export type ProjectileVisual = 
  | 'bullet' 
  | 'shotgun_pellet' 
  | 'flame' 
  | 'frost' 
  | 'crossbow_bolt' 
  | 'sniper_beam' 
  | 'dynamite' 
  | 'sonic_wave' 
  | 'grenade' 
  | 'laser_beam';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  color: string;
  life: number;
  maxLife: number;
  pierce: number;
  isHeavy: boolean;
  visualType?: ProjectileVisual;
  statusEffect?: 'bleed' | 'burn' | 'shock' | 'freeze';
  isAreaHazard?: boolean; // 火海 / 毒霧
  tickTimer?: number;
  tickInterval?: number;
  isBoomerang?: boolean;  // 迴旋鐮刀
  isTrap?: boolean;       // 定身捕獸夾
  isGrapple?: boolean;    // 鋼纜抓鉤
  isBlackHole?: boolean;  // 引力黑洞漩渦
  isNuke?: boolean;       // 輪盤毀滅核彈
  ricochetCount?: number; // 彈射跳彈剩餘次數
  rotation?: number;      // 旋轉角度
  rotSpeed?: number;
  hitTargets?: Set<any>;
}

export class ProjectileManager {
  public list: Projectile[] = [];

  public update(dt: number, playerX?: number, playerY?: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];

      if (p.isBoomerang && playerX !== undefined && playerY !== undefined) {
        // 迴旋鏢前半程往前，後半程加速飛回主角
        if (p.life < p.maxLife * 0.55) {
          const dx = playerX - p.x;
          const dy = playerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) {
            p.vx = (dx / dist) * 540;
            p.vy = (dy / dist) * 540;
          } else {
            // 接回鐮刀
            this.list.splice(i, 1);
            continue;
          }
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.rotation !== undefined && p.rotSpeed !== undefined) {
        p.rotation += p.rotSpeed * dt;
      }
      
      // 撞牆或壽命終止
      if (p.life <= 0) {
        this.list.splice(i, 1);
        continue;
      }

      if (!p.isAreaHazard && !p.isTrap) {
        // 邊界碰撞檢測
        const minX = 25, maxX = 515, minY = 65, maxY = 895;
        if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
          if (p.ricochetCount && p.ricochetCount > 0) {
            p.ricochetCount--;
            p.damage *= 1.35; // 每次彈跳增傷 35%
            if (p.x < minX) { p.x = minX + 1; p.vx = Math.abs(p.vx); }
            if (p.x > maxX) { p.x = maxX - 1; p.vx = -Math.abs(p.vx); }
            if (p.y < minY) { p.y = minY + 1; p.vy = Math.abs(p.vy); }
            if (p.y > maxY) { p.y = maxY - 1; p.vy = -Math.abs(p.vy); }
          } else {
            this.list.splice(i, 1);
            continue;
          }
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    for (const p of this.list) {
      ctx.save();
      const px = p.x + offsetX;
      const py = p.y + offsetY;
      const angle = Math.atan2(p.vy, p.vx);

      if (p.isAreaHazard) {
        ctx.globalAlpha = Math.min(0.6, p.life / p.maxLife * 0.7);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.isTrap) {
        // 繪製捕獸夾陷阱
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 10, py - 10, 20, 20);
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.isBlackHole) {
        // 時空引力黑洞 (Gravitational Void)
        ctx.translate(px, py);
        const rot = (Date.now() / 200);
        ctx.rotate(rot);

        // 外層引力光環
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, p.radius);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.5, '#7b1fa2');
        grad.addColorStop(0.85, '#00e5ff');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // 核心事件視界
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.isBoomerang) {
        // 旋轉巨大血色迴旋鐮
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 1.3);
        ctx.stroke();
        ctx.fillStyle = '#ff1744';
        ctx.fill();
      } else if (p.visualType === 'flame') {
        // 1. 火焰噴射：漸變膨脹火舌
        ctx.translate(px, py);
        const flameRatio = 1 - (p.life / p.maxLife);
        const fRadius = p.radius * (1 + flameRatio * 1.8);
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, fRadius);
        grad.addColorStop(0, '#ffff55');
        grad.addColorStop(0.4, '#ff6600');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, fRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.visualType === 'frost') {
        // 2. 極寒冰錐：旋轉晶瑩冰晶
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = '#e0f7fa';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -p.radius * 1.5);
        ctx.lineTo(p.radius, 0);
        ctx.lineTo(0, p.radius * 1.5);
        ctx.lineTo(-p.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.visualType === 'crossbow_bolt') {
        // 3. 十字重弩矢：帶箭羽的破甲鋼箭
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        // 箭頭
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(6, -4);
        ctx.lineTo(6, 4);
        ctx.closePath();
        ctx.fill();
        // 箭羽
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, -3);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-10, 3);
        ctx.stroke();
      } else if (p.visualType === 'sniper_beam') {
        // 4. 狙擊死光彈：長條超音速雷射拖尾
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.strokeStyle = p.color || '#00ffff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = p.color || '#00ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.visualType === 'dynamite') {
        // 5. 旋轉燃燒炸藥棒 / 滾動酒桶
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color || '#cc0000';
        ctx.fillRect(-12, -6, 24, 12);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-12, -6, 24, 12);
        // 引線火星
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(14, 0, 3 + Math.sin(Date.now() / 50) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.visualType === 'grenade') {
        // 6. 毒氣榴彈罐
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.visualType === 'sonic_wave') {
        // 7. 音叉音波環
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.strokeStyle = '#b388ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();
      } else if (p.visualType === 'shotgun_pellet') {
        // 8. 霰彈鋼珠
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - p.vx * 0.015, py - p.vy * 0.015);
        ctx.stroke();
      } else {
        // 9. 標準高光槍彈 (帶流線拖尾)
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.isHeavy ? 12 : 5;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - (p.vx * 0.03), py - (p.vy * 0.03));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  public spawnBullet(x: number, y: number, angle: number, speed: number, damage: number, isPlayer: boolean, color: string = '#ffd700', isHeavy: boolean = false, pierce: number = 1, statusEffect?: 'bleed' | 'burn' | 'shock' | 'freeze', visualType: ProjectileVisual = 'bullet', ricochetCount: number = 0) {
    this.list.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: isHeavy ? 6.5 : (visualType === 'shotgun_pellet' ? 2.5 : 4),
      damage,
      isPlayer,
      color,
      life: 2.5,
      maxLife: 2.5,
      pierce,
      isHeavy,
      statusEffect,
      visualType,
      ricochetCount,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 12
    });
  }

  public spawnBoomerang(x: number, y: number, angle: number, speed: number, damage: number, color: string = '#ff1744', isPlayer: boolean = true) {
    this.list.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 18,
      damage,
      isPlayer,
      color,
      life: 2.2,
      maxLife: 2.2,
      pierce: 999,
      isHeavy: true,
      isBoomerang: true,
      rotation: 0,
      rotSpeed: 18,
      statusEffect: 'bleed'
    });
  }

  public spawnTrap(x: number, y: number, damage: number = 40, isPlayer: boolean = true) {
    this.list.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 20,
      damage,
      isPlayer,
      color: isPlayer ? '#8b4513' : '#ff1744',
      life: 12.0,
      maxLife: 12.0,
      pierce: 1,
      isHeavy: false,
      isTrap: true
    });
  }

  public spawnHazardArea(x: number, y: number, radius: number, duration: number, damagePerSec: number, color: string = 'rgba(230, 80, 20, 0.4)', status: 'burn' | 'bleed' | 'freeze', isPlayer: boolean = true) {
    this.list.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      damage: damagePerSec,
      isPlayer,
      color,
      life: duration,
      maxLife: duration,
      pierce: 999,
      isHeavy: false,
      isAreaHazard: true,
      tickTimer: 0,
      tickInterval: 0.35,
      statusEffect: status
    });
  }

  public spawnBlackHole(x: number, y: number, radius: number = 140, duration: number = 3.5, damagePerSec: number = 45) {
    this.list.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      damage: damagePerSec,
      isPlayer: true,
      color: '#7b1fa2',
      life: duration,
      maxLife: duration,
      pierce: 999,
      isHeavy: true,
      isBlackHole: true,
      isAreaHazard: true,
      tickTimer: 0,
      tickInterval: 0.25
    });
  }
}

