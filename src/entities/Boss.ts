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

    // 建立地面危險紅光預警 (Precision Telegraphs)
    if (pick.type === 'mortar_strike') {
      this.activeTelegraph = { type: 'circle', x: player.x, y: player.y, angle: 0, radius: 95, length: 0, width: 0 };
    } else if (pick.type === 'acid_miasma') {
      this.activeTelegraph = { type: 'circle', x: player.x, y: player.y, angle: 0, radius: 110, length: 0, width: 0 };
    } else if (pick.type === 'crystal_chandelier') {
      this.activeTelegraph = { type: 'circle', x: 270, y: 460, angle: 0, radius: 180, length: 0, width: 0 };
    } else if (pick.type === 'slam') {
      this.activeTelegraph = { type: 'circle', x: this.x, y: this.y, angle: 0, radius: 130, length: 0, width: 0 };
    } else if (pick.type === 'rush' || pick.type === 'rolling_barrel' || pick.type === 'ice_avalanche') {
      this.activeTelegraph = { type: 'line', x: this.x, y: this.y, angle: this.facingAngle, radius: 0, length: 360, width: 65 };
    } else if (pick.type === 'laser' || pick.type === 'grapple_pull') {
      this.activeTelegraph = { type: 'line', x: this.x, y: this.y, angle: this.facingAngle, radius: 0, length: 550, width: 22 };
    } else if (pick.type === 'whirlwind' || pick.type === 'sound_wave' || pick.type === 'bullet_hell' || pick.type === 'bouncing_chips' || pick.type === 'apocalypse_combo') {
      this.activeTelegraph = { type: 'circle', x: this.x, y: this.y, angle: 0, radius: 160, length: 0, width: 0 };
    } else {
      this.activeTelegraph = { type: 'circle', x: this.x, y: this.y, angle: 0, radius: 90, length: 0, width: 0 };
    }
  }

  private executeMove(move: BossMove, player: Player, angle: number, projectiles: ProjectileManager, particles: ParticleSystem) {
    AudioManager.playExplosion();
    const telX = this.activeTelegraph?.x ?? this.x;
    const telY = this.activeTelegraph?.y ?? this.y;
    this.activeTelegraph = null;
    const dmg = move.damage * (1 + (this.loopCount - 1) * 0.25);

    switch (move.type) {
      case 'rush': {
        this.state = 'rush';
        this.rushVx = Math.cos(angle) * 560;
        this.rushVy = Math.sin(angle) * 560;
        this.rushTimer = 0.5;
        particles.spawnExplosion(this.x, this.y);
        return;
      }

      case 'mortar_strike': { // 3 連天頂迫擊砲地毯轟炸
        AudioManager.playShot('shotgun');
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 80;
          const offsetY = (Math.random() - 0.5) * 80;
          const targetX = Math.max(40, Math.min(500, telX + offsetX));
          const targetY = Math.max(90, Math.min(870, telY + offsetY));
          particles.spawnExplosion(targetX, targetY);
          projectiles.spawnHazardArea(targetX, targetY, 65, 3.5, dmg * 0.35, 'rgba(255, 69, 0, 0.55)', 'burn', false);
        }
        particles.addDamageText(this.x, this.y - 25, '迫擊砲地毯轟炸！', '#ff4500', true);
        break;
      }

      case 'laser': { // 穿甲狙擊死光
        AudioManager.playShot('revolver');
        projectiles.spawnBullet(this.x, this.y, angle, 980, dmg * 1.6, false, '#00ffff', true, 5, undefined, 'sniper_beam');
        particles.spawnSmoke(this.x, this.y, 14, 'rgba(0, 255, 255, 0.6)');
        break;
      }

      case 'rolling_barrel': { // 3 隻滾動炸藥私酒桶
        AudioManager.playShot('shotgun');
        for (let i = -1; i <= 1; i++) {
          const bAngle = angle + i * 0.28;
          projectiles.spawnBullet(this.x, this.y, bAngle, 280, dmg * 0.8, false, '#8b4513', true, 1, 'burn', 'dynamite', 2);
        }
        particles.addDamageText(this.x, this.y - 20, '滾動私酒炸藥桶！', '#d4af37', true);
        break;
      }

      case 'bouncing_chips': { // 12 顆反彈 4 次的黃金籌碼彈
        AudioManager.playCash();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 360, dmg * 0.45, false, '#ffd700', true, 1, undefined, 'bullet', 4);
        }
        particles.addDamageText(this.x, this.y - 20, '輪盤黃金籌碼雨！', '#ffd700', true);
        break;
      }

      case 'scythe_boomerang': { // 雙 8 字血色迴旋雙飛鐮
        projectiles.spawnBoomerang(this.x, this.y, angle - 0.4, 440, dmg * 1.3, '#ff1744', false);
        projectiles.spawnBoomerang(this.x, this.y, angle + 0.4, 440, dmg * 1.3, '#ff1744', false);
        particles.addDamageText(this.x, this.y - 20, '血色迴旋飛鐮！', '#ff1744', true);
        break;
      }

      case 'sound_wave': { // 管風琴多層高頻紫色聲波環
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + (r * 0.3);
            projectiles.spawnBullet(this.x, this.y, a, 240 + r * 50, dmg * 0.35, false, '#b388ff', false, 999, 'shock', 'sonic_wave');
          }
        }
        particles.addDamageText(this.x, this.y - 25, '管風琴狂想音波！', '#b388ff', true);
        break;
      }

      case 'grapple_pull': { // 鋼纜抓鉤猛拽
        const pDist = Math.hypot(player.x - this.x, player.y - this.y);
        if (pDist < 300) {
          player.x = this.x + Math.cos(angle) * 45;
          player.y = this.y + Math.sin(angle) * 45;
          player.takeDamage(dmg * 0.6, particles, this.x, this.y);
          particles.spawnElectricSparks(player.x, player.y, 16);
          particles.addDamageText(player.x, player.y - 20, '鋼纜抓鉤抓取！', '#ff3333', true);
          AudioManager.playHit();
        }
        break;
      }

      case 'trap_field': { // 佈設 3 個隱蔽捕獸夾
        for (let i = 0; i < 3; i++) {
          const tx = Math.max(50, Math.min(490, this.x + (Math.random() - 0.5) * 160));
          const ty = Math.max(100, Math.min(850, this.y + (Math.random() - 0.5) * 160));
          projectiles.spawnTrap(tx, ty, dmg * 0.8, false);
        }
        particles.addDamageText(this.x, this.y - 20, '連環捕獸夾！', '#8b4513', true);
        break;
      }

      case 'drone_swarm': { // 召喚自爆發條無人機
        this.pendingMinionSpawns += 2;
        particles.spawnSmoke(this.x, this.y, 25, '#78909c');
        particles.addDamageText(this.x, this.y - 20, '發條無人機出擊！', '#00e5ff', true);
        break;
      }

      case 'ice_avalanche': { // 滾動巨大冰山碾壓
        for (let i = -2; i <= 2; i++) {
          projectiles.spawnBullet(this.x, this.y, angle + i * 0.15, 340, dmg * 0.45, false, '#00e5ff', true, 2, 'freeze', 'frost');
        }
        projectiles.spawnHazardArea(this.x + Math.cos(angle) * 80, this.y + Math.sin(angle) * 80, 75, 4.0, dmg * 0.3, 'rgba(0, 229, 255, 0.45)', 'freeze', false);
        particles.addDamageText(this.x, this.y - 20, '極寒冰山碾壓！', '#00e5ff', true);
        break;
      }

      case 'acid_miasma': { // 擴散型腐蝕毒霧沼澤
        projectiles.spawnHazardArea(telX, telY, 95, 4.5, dmg * 0.4, 'rgba(46, 204, 113, 0.5)', 'bleed', false);
        particles.spawnSmoke(telX, telY, 30, '#2e7d32');
        particles.addDamageText(this.x, this.y - 20, '腐蝕生化毒瘴！', '#2ecc71', true);
        break;
      }

      case 'crystal_chandelier': { // 天花板巨型水晶吊燈砸落
        particles.spawnExplosion(270, 460);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          projectiles.spawnBullet(270, 460, a, 380, dmg * 0.6, false, '#e0f7fa', true, 1, undefined, 'bullet');
        }
        projectiles.spawnHazardArea(270, 460, 110, 4.0, dmg * 0.4, 'rgba(224, 247, 250, 0.4)', 'bleed', false);
        particles.addDamageText(270, 430, '💎 水晶吊燈砸落！', '#e040fb', true);
        break;
      }

      case 'apocalypse_combo': { // 始祖夜鶯終極輪迴全解放
        particles.spawnExplosion(this.x, this.y);
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 420, dmg * 0.55, false, '#ffd700', true, 2, undefined, 'bullet', 2);
        }
        projectiles.spawnBoomerang(this.x, this.y, angle, 460, dmg * 1.5, '#ff1744', false);
        projectiles.spawnBullet(this.x, this.y, angle, 1100, dmg * 2.0, false, '#00ffff', true, 8, undefined, 'sniper_beam');
        particles.addDamageText(this.x, this.y - 30, '🌟 暗夜終極輪迴解放！', '#ffd700', true);
        break;
      }

      case 'slam': {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 280, dmg * 0.55, false, this.weapon.color, true);
        }
        projectiles.spawnHazardArea(this.x, this.y, 70, 2.5, dmg * 0.35, 'rgba(255, 69, 0, 0.45)', 'burn', false);
        particles.spawnExplosion(this.x, this.y);
        break;
      }

      case 'whirlwind': {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 340, dmg * 0.6, false, this.weapon.color, true);
        }
        particles.spawnExplosion(this.x, this.y);
        break;
      }

      case 'spawn_minions': {
        this.pendingMinionSpawns += this.isEnraged ? 3 : 2;
        particles.spawnSmoke(this.x, this.y, 30);
        particles.addDamageText(this.x, this.y - 20, '呼叫黑道打手', '#ffd700', true);
        break;
      }

      case 'smoke_teleport': {
        particles.spawnSmoke(this.x, this.y, 35);
        const tpAngle = Math.random() * Math.PI * 2;
        this.x = Math.max(60, Math.min(480, player.x + Math.cos(tpAngle) * 130));
        this.y = Math.max(120, Math.min(820, player.y + Math.sin(tpAngle) * 130));
        particles.spawnSmoke(this.x, this.y, 35);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 300, dmg * 0.5, false, '#8e44ad');
        }
        break;
      }

      default: { // bullet_hell
        const count = this.isEnraged ? 24 : 16;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 280, dmg * 0.5, false, this.weapon.color);
        }
        break;
      }
    }

    this.state = 'chase';
    this.actionCooldown = this.isEnraged ? 0.75 : 1.4;
  }

  public takeDamage(amount: number, particles: ParticleSystem) {
    this.hitFlashTimer = 0.05;
    if (this.armor > 0) {
      this.armor -= amount;
      particles.spawnElectricSparks(this.x, this.y, 6);
      AudioManager.playHit();
      if (this.armor <= 0) {
        this.armor = 0;
        particles.addDamageText(this.x, this.y - 30, '護甲破碎！', '#00e5ff', true);
        AudioManager.playExplosion();
      }
      return;
    }

    this.hp -= amount;
    particles.spawnBlood(this.x, this.y, 5);
    AudioManager.playHit();

    if (this.hp <= this.maxHp * 0.45 && !this.isEnraged) {
      this.isEnraged = true;
      this.speed *= 1.35;
      particles.addDamageText(this.x, this.y - 30, '狂暴怒吼！', '#ff1744', true);
      AudioManager.playExplosion();
    }

    if (this.hp <= 0 && !this.isDead) {
      this.isDead = true;
      this.hp = 0;
      AudioManager.playExplosion();
      AudioManager.playCash();
      particles.spawnExplosion(this.x, this.y);
      particles.spawnCashSparkle(this.x, this.y);
    }
  }

  private clampPosition() {
    this.x = Math.max(50, Math.min(490, this.x));
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
      const telX = (tel.x !== undefined ? tel.x : this.x) + offsetX;
      const telY = (tel.y !== undefined ? tel.y : this.y) + offsetY;

      if (tel.type === 'circle') {
        ctx.fillStyle = 'rgba(255, 30, 30, 0.18)';
        ctx.beginPath();
        ctx.arc(telX, telY, tel.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 0, 0, 0.38)';
        ctx.beginPath();
        ctx.arc(telX, telY, tel.radius * progress, 0, Math.PI * 2);
        ctx.fill();
      } else if (tel.type === 'line') {
        ctx.translate(telX, telY);
        ctx.rotate(tel.angle);

        ctx.fillStyle = 'rgba(255, 30, 30, 0.15)';
        ctx.fillRect(0, -tel.width / 2, tel.length, tel.width);

        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -tel.width / 2, tel.length, tel.width);

        ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
        ctx.fillRect(0, -tel.width / 2, tel.length * progress, tel.width);
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

