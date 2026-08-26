import { ENEMY_DATABASE, EnemyInfo } from '../data/EnemyDatabase';
import { Player } from './Player';
import { ProjectileManager } from './Projectile';
import { ParticleSystem } from './ParticleSystem';
import { AudioManager } from '../core/AudioManager';
import { GameState } from '../core/GameState';

export class Enemy {
  public x: number;
  public y: number;
  public facingAngle: number = 0;
  public info: EnemyInfo;
  public hp: number;
  public maxHp: number;
  public radius: number = 14;
  public isElite: boolean = false;
  public loopCount: number = 1;
  public effectiveDamage: number;

  public state: 'chase' | 'windup' | 'attack' | 'stagger' | 'idle' = 'chase';
  public windupTimer: number = 0;
  public attackCooldown: number = 0;
  public staggerTimer: number = 0;

  // 狀態異常
  public bleedTimer: number = 0;
  public burnTimer: number = 0;
  public shockTimer: number = 0;
  public freezeTimer: number = 0;
  public freezeStacks: number = 0;
  public isFrozenSolid: boolean = false;
  public isMarked: boolean = false;
  public markTimer: number = 0;
  public armorReduction: number = 0; // 0.0 ~ 0.7

  // 嘲諷殘影引導
  public tauntX: number | null = null;
  public tauntY: number | null = null;
  public tauntTimer: number = 0;

  public lastHitTimer: number = 0; // 用於動態顯示血條
  public hitFlashTimer: number = 0; // 受擊純白硬質閃爍反饋 (Hit Flash)
  public isDead: boolean = false;

  // 物理衝擊與撞牆碎骨 (Knockback & Wall Splat)
  public knockbackVx: number = 0;
  public knockbackVy: number = 0;
  public wallSplatPendingDmg: number = 0;

  constructor(id: number, x: number, y: number, isElite: boolean = false, loopCount: number = 1) {
    this.info = ENEMY_DATABASE[id] || ENEMY_DATABASE[1];
    this.isElite = isElite;
    this.loopCount = loopCount;
    if (isElite) this.radius = 18;

    // 依據輪迴次數 (Loop) 與菁英屬性等比強化
    const loopHpMult = 1 + (loopCount - 1) * 0.35;
    const loopDmgMult = 1 + (loopCount - 1) * 0.20;
    const eliteHpMult = isElite ? 2.2 : 1.0;
    const eliteDmgMult = isElite ? 1.5 : 1.0;

    this.hp = Math.round(this.info.hp * loopHpMult * eliteHpMult);
    this.maxHp = this.hp;
    this.effectiveDamage = Math.round(this.info.damage * loopDmgMult * eliteDmgMult);

    this.x = x;
    this.y = y;
    this.attackCooldown = 0.15 + Math.random() * 0.25;
  }

  public update(dt: number, player: Player, projectiles: ProjectileManager, particles: ParticleSystem) {
    if (this.isDead) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.lastHitTimer > 0) this.lastHitTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.markTimer > 0) {
      this.markTimer -= dt;
      if (this.markTimer <= 0) this.isMarked = false;
    }

    // 物理擊退位移與撞牆判定 (Knockback & Wall Splat Collision)
    const kbSpeed = Math.hypot(this.knockbackVx, this.knockbackVy);
    if (kbSpeed > 15) {
      this.x += this.knockbackVx * dt;
      this.y += this.knockbackVy * dt;
      this.knockbackVx *= Math.pow(0.02, dt);
      this.knockbackVy *= Math.pow(0.02, dt);

      let hitWall = false;
      if (this.x < 35) { this.x = 35; hitWall = true; }
      if (this.x > 505) { this.x = 505; hitWall = true; }
      if (this.y < 75) { this.y = 75; hitWall = true; }
      if (this.y > 885) { this.y = 885; hitWall = true; }

      if (hitWall && this.wallSplatPendingDmg > 0) {
        const splatDmg = this.wallSplatPendingDmg;
        this.wallSplatPendingDmg = 0;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.takeDamage(splatDmg, particles, 'shock', true);
        this.staggerTimer = 1.0;
        this.state = 'stagger';
        AudioManager.playHit();
        particles.spawnSmoke(this.x, this.y, 8, '#ffd700');
        particles.spawnElectricSparks(this.x, this.y, 10);
        particles.addDamageText(this.x, this.y, '撞牆碎骨！', '#ff5722', true);
      }
    }

    if (this.tauntTimer > 0) {
      this.tauntTimer -= dt;
      if (this.tauntTimer <= 0) {
        this.tauntX = null;
        this.tauntY = null;
      }
    }

    // 狀態異常結算
    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      // c2 大出血: 移動時流血加倍
      const isMoving = this.state === 'chase';
      const mult = isMoving && GameState.currentRun && GameState.currentRun.activeBoons.includes('c2') ? 2.5 : 1.0;
      this.hp -= 15 * mult * dt;
      if (Math.random() < 0.3) particles.spawnBlood(this.x, this.y, 1);
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.hp -= 18 * dt;
      if (Math.random() < 0.3) particles.spawnMuzzleFlash(this.x, this.y, Math.PI / 2, '#ff4500');
    }

    if (this.shockTimer > 0) {
      this.shockTimer -= dt;
      if (Math.random() < 0.25) particles.spawnElectricSparks(this.x, this.y, 2);
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.isFrozenSolid = false;
        this.freezeStacks = 0;
      }
    }

    // k7 寒冬之擁 (主角光環減速)
    if (GameState.currentRun && GameState.currentRun.activeBoons.includes('k7')) {
      const dpx = player.x - this.x;
      const dpy = player.y - this.y;
      if (Math.sqrt(dpx * dpx + dpy * dpy) < 140) {
        this.freezeTimer = Math.max(this.freezeTimer, 0.5);
      }
    }

    if (this.hp <= 0) {
      this.die(player, projectiles, particles);
      return;
    }

    // 感電擊暈或冰雕完全凍結時無法行動
    if (this.isFrozenSolid || (this.shockTimer > 0 && this.state === 'windup')) {
      return;
    }

    // 目標定位 (嘲諷殘影 vs 主角)
    const targetX = (this.tauntX !== null) ? this.tauntX : player.x;
    const targetY = (this.tauntY !== null) ? this.tauntY : player.y;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // 煙霧或技能潛行判定 (主角隱蔽於煙霧中且未近身 70px)
    const isPlayerHidden = player.stealthTimer > 0 && dist > 70 && this.tauntX === null;
    if (isPlayerHidden) {
      this.state = 'idle';
      this.facingAngle += Math.sin(Date.now() / 400) * 0.02;
      this.x = Math.max(38, Math.min(502, this.x));
      this.y = Math.max(88, Math.min(872, this.y));
      return;
    } else if (this.state === 'idle') {
      this.state = 'chase';
    }

    const directAngle = Math.atan2(dy, dx);
    this.facingAngle = directAngle;

    const speedMod = this.freezeTimer > 0 ? 0.45 : (this.shockTimer > 0 ? 0.7 : 1.0);
    const archetype = this.info.aiArchetype || 'swarm';

    // 狀態機
    if (this.state === 'stagger') {
      this.staggerTimer -= dt;
      if (this.staggerTimer <= 0) this.state = 'chase';
    } else if (this.state === 'chase') {
      // 依據戰術 AI 原型執行差異化走位
      let moveAngle = directAngle;
      let curSpeed = this.info.speed * speedMod;

      if (archetype === 'flanker') {
        // 繞後刺客：呈 65 度弧形繞行包夾玩家後背
        const flankSign = (this.x % 2 === 0) ? 1 : -1;
        if (dist > this.info.attackRange + 15) {
          moveAngle = directAngle + flankSign * (Math.PI * 0.38);
        }
      } else if (archetype === 'kiter') {
        // 風箏射手：若玩家過於靠近 (< 130px) 則戰術後撤拉開距離
        if (dist < 130) {
          moveAngle = directAngle + Math.PI;
          curSpeed *= 1.1;
        } else if (dist > this.info.attackRange) {
          moveAngle = directAngle;
        } else {
          curSpeed = 0;
        }
      } else if (archetype === 'sniper') {
        // 狙擊手：保持在遠端超遠射程 (> 220px)
        if (dist < 180) {
          moveAngle = directAngle + Math.PI;
        } else if (dist > this.info.attackRange) {
          moveAngle = directAngle;
        } else {
          curSpeed = 0;
        }
      } else if (archetype === 'swarm') {
        // 抱團群毆：近身 150px 狂暴衝鋒提速 20%
        if (dist < 150) curSpeed *= 1.2;
      }

      // 移動執行與攻擊前搖判定
      if (curSpeed > 0 && dist > this.info.attackRange) {
        this.x += Math.cos(moveAngle) * curSpeed * dt;
        this.y += Math.sin(moveAngle) * curSpeed * dt;
      } else {
        if (this.attackCooldown <= 0) {
          this.state = 'windup';
          this.windupTimer = Math.max(0.08, this.info.windupTime * 0.7);
        } else if (archetype === 'swarm' || archetype === 'shield') {
          // 冷卻期持續緩步逼近
          this.x += Math.cos(directAngle) * (curSpeed * 0.4) * dt;
          this.y += Math.sin(directAngle) * (curSpeed * 0.4) * dt;
        }
      }
    } else if (this.state === 'windup') {
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        this.state = 'attack';
        this.executeAttack(player, this.facingAngle, projectiles, particles);
        this.attackCooldown = archetype === 'kiter' ? 0.55 : (archetype === 'sniper' ? 0.95 : 0.65);
        this.state = 'chase';
      }
    } else {
      this.state = 'chase';
    }

    // 嚴格限制在戰鬥場地內，絕不被推出邊界外
    this.x = Math.max(38, Math.min(502, this.x));
    this.y = Math.max(88, Math.min(872, this.y));
  }

  private executeAttack(player: Player, angle: number, projectiles: ProjectileManager, particles: ParticleSystem) {
    const dmg = this.effectiveDamage || this.info.damage;

    if (this.info.attackType === 'melee_slash' || this.info.attackType === 'pounce') {
      // 近戰判定
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.info.attackRange + 20) {
        player.takeDamage(dmg, particles, this.x, this.y);
      }
    } else if (this.info.attackType === 'shoot_bullet') {
      projectiles.spawnBullet(this.x, this.y, angle, 340, dmg, false, '#ff3333');
    } else if (this.info.attackType === 'buckshot') {
      for (let i = -1; i <= 1; i++) {
        projectiles.spawnBullet(this.x, this.y, angle + i * 0.2, 300, dmg * 0.5, false, '#ff4500');
      }
    } else if (this.info.attackType === 'sniper_laser') {
      projectiles.spawnBullet(this.x, this.y, angle, 750, dmg * 1.2, false, '#ff0000', true);
    } else if (this.info.attackType === 'flame_jet') {
      projectiles.spawnHazardArea(this.x + Math.cos(angle) * 35, this.y + Math.sin(angle) * 35, 35, 2.0, dmg, 'rgba(255, 69, 0, 0.45)', 'burn');
    } else if (this.info.attackType === 'toss_molotov') {
      // 投擲毒氣/燃燒瓶
      const tx = player.x + (Math.random() - 0.5) * 30;
      const ty = player.y + (Math.random() - 0.5) * 30;
      projectiles.spawnHazardArea(tx, ty, 42, 3.0, dmg * 0.8, 'rgba(46, 204, 113, 0.45)', 'bleed');
      particles.spawnExplosion(tx, ty);
    } else if (this.info.attackType === 'charge') {
      this.x += Math.cos(angle) * 60;
      this.y += Math.sin(angle) * 60;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) < 36) {
        player.takeDamage(dmg * 1.3, particles, this.x, this.y);
      }
    }
  }

  public takeDamage(amount: number, particles: ParticleSystem, status?: 'bleed' | 'burn' | 'shock' | 'freeze', isPlayerCrit: boolean = false, fromPlayerAngle?: number): number {
    let finalAmount = amount * (1.0 + this.armorReduction);

    // 1. 防暴重盾兵 (shield archetype) 正面 85% 格擋判定
    if (this.info.aiArchetype === 'shield' && fromPlayerAngle !== undefined) {
      let angleToAttacker = Math.abs(fromPlayerAngle - (this.facingAngle + Math.PI));
      if (angleToAttacker > Math.PI) angleToAttacker = Math.PI * 2 - angleToAttacker;
      // 若攻擊來自正前方 80 度扇形區且非重型破盾暴擊
      if (angleToAttacker < 1.4 && !isPlayerCrit) {
        finalAmount *= 0.15; // 85% 鋼盾格擋減傷
        particles.spawnElectricSparks(this.x, this.y, 6);
        AudioManager.playHit();
        particles.addDamageText(this.x, this.y, '格擋 ' + Math.round(finalAmount), '#4682b4');
        this.lastHitTimer = 2.0;
        this.hp -= finalAmount;
        return finalAmount;
      }
    }

    // c7 死亡標記增傷 35%
    if (this.isMarked) finalAmount *= 1.35;

    // k10 傳奇永凍領域: 凍結目標受傷害翻倍
    if (this.freezeTimer > 0 && GameState.currentRun && GameState.currentRun.activeBoons.includes('k10')) {
      finalAmount *= 2.0;
    }

    // i8 高溫蒸發: 低血燃燒敵人傷害翻倍
    if (this.burnTimer > 0 && this.hp < this.maxHp * 0.3 && GameState.currentRun && GameState.currentRun.activeBoons.includes('i8')) {
      finalAmount *= 2.0;
    }

    // c5 背刺處刑判定 (從背後 90 度以內攻擊)
    let isBackstab = false;
    if (fromPlayerAngle !== undefined) {
      let diff = Math.abs(fromPlayerAngle - this.facingAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < 1.0) {
        isBackstab = true;
        if (GameState.currentRun && GameState.currentRun.activeBoons.includes('c5')) {
          finalAmount *= 2.5;
          isPlayerCrit = true;
        }
      }

      // 受擊輕微擊退 (Knockback) 提升射擊打擊感
      const kb = isPlayerCrit ? 18 : 8;
      this.x += Math.cos(fromPlayerAngle) * kb;
      this.y += Math.sin(fromPlayerAngle) * kb;
    }

    this.hp -= finalAmount;
    this.lastHitTimer = 2.5;
    this.hitFlashTimer = 0.05;
    this.state = 'stagger';
    this.staggerTimer = 0.08;

    if (isPlayerCrit) {
      AudioManager.playCritHit();
      particles.spawnBlood(this.x, this.y, 8);
      particles.spawnElectricSparks(this.x, this.y, 6);
    } else {
      AudioManager.playHit();
      particles.spawnBlood(this.x, this.y, 4);
    }

    const hitText = isBackstab ? '背刺 ' + Math.round(finalAmount) : Math.round(finalAmount).toString();
    particles.addDamageText(this.x, this.y, hitText, isPlayerCrit ? '#ffd700' : '#ffffff', isPlayerCrit);

    // === 跨派系雙重元素化學融合反應 (Dual Elemental Synergies) ===
    if (status) {
      // 1. 【燃燒 + 電擊】➔ 【超載爆轟 (Overload Blast)】
      if ((status === 'shock' && this.burnTimer > 0) || (status === 'burn' && this.shockTimer > 0)) {
        particles.spawnExplosion(this.x, this.y);
        particles.spawnElectricSparks(this.x, this.y, 12);
        AudioManager.playExplosion();
        const overloadDmg = 65;
        this.hp -= overloadDmg;
        finalAmount += overloadDmg;
        particles.addDamageText(this.x, this.y, '超載爆轟 65', '#00e5ff', true);
        this.burnTimer = 0;
        this.shockTimer = 0;
      }
      // 2. 【流血 + 冰凍】➔ 【血晶碎裂 (Bloodshard Shatter)】
      else if ((status === 'freeze' && this.bleedTimer > 0) || (status === 'bleed' && this.freezeTimer > 0)) {
        particles.spawnIceCrystals(this.x, this.y, 16);
        particles.spawnBlood(this.x, this.y, 10);
        AudioManager.playSlash();
        const shatterDmg = 45;
        this.hp -= shatterDmg;
        finalAmount += shatterDmg;
        particles.addDamageText(this.x, this.y, '血晶碎裂 45', '#ff1744', true);
        this.bleedTimer = 0;
      }
      // 3. 【流血 + 燃燒】➔ 【沸血蒸騰 (Boiling Blood)】
      else if ((status === 'burn' && this.bleedTimer > 0) || (status === 'bleed' && this.burnTimer > 0)) {
        particles.spawnExplosion(this.x, this.y);
        const boilDmg = 35;
        this.hp -= boilDmg;
        finalAmount += boilDmg;
        particles.addDamageText(this.x, this.y, '沸血蒸騰 35', '#ff5722', true);
      }
      // 4. 【電磁 + 極寒】➔ 【超導低溫 (Superconductor)】
      else if ((status === 'shock' && this.freezeTimer > 0) || (status === 'freeze' && this.shockTimer > 0)) {
        particles.spawnElectricSparks(this.x, this.y, 10);
        particles.spawnIceCrystals(this.x, this.y, 10);
        this.isFrozenSolid = true;
        this.freezeTimer = 2.0;
        this.shockTimer = 2.0;
        particles.addDamageText(this.x, this.y, '超導凍結', '#80d8ff', true);
      }
    }

    if (status === 'bleed') this.bleedTimer = 3.5;
    if (status === 'burn') {
      this.burnTimer = 3.5;
      if (GameState.currentRun && GameState.currentRun.activeBoons.includes('i6')) {
        this.armorReduction = Math.max(this.armorReduction, 0.4);
      }
    }
    if (status === 'shock') {
      this.shockTimer = 2.0;
      particles.spawnElectricSparks(this.x, this.y, 6);
    }
    if (status === 'freeze') {
      this.freezeTimer = 2.5;
      this.freezeStacks++;
      particles.spawnIceCrystals(this.x, this.y, 5);
      if (this.freezeStacks >= 4 || (GameState.currentRun && GameState.currentRun.activeBoons.includes('k4') && this.freezeStacks >= 3)) {
        this.isFrozenSolid = true;
        this.freezeTimer = 2.5;
      }
    }

    // c5 天降斷頭台斬首處刑
    if (GameState.currentRun?.activeBoons.includes('c5') && this.hp > 0 && this.hp <= this.maxHp * 0.25) {
      this.hp = 0;
      particles.addDamageText(this.x, this.y - 25, '🪓 斷頭台斬首！', '#ff1744', true);
      AudioManager.playSlash();
      particles.spawnBlood(this.x, this.y, 25);
    }

    // p1 提線木偶引線 (操控敵方轉向攻擊身邊怪物)
    if (GameState.currentRun?.activeBoons.includes('p1') && Math.random() < 0.25) {
      this.tauntTimer = 3.0;
      this.facingAngle += Math.PI;
      particles.addDamageText(this.x, this.y - 25, '🎭 木偶操控！', '#e040fb', true);
    }

    return finalAmount;
  }

  public die(player: Player, projectiles: ProjectileManager, particles: ParticleSystem) {
    if (this.isDead) return;
    this.isDead = true;

    particles.spawnBlood(this.x, this.y, this.isElite ? 28 : 16);
    particles.spawnCashSparkle(this.x, this.y);
    if (this.isElite) {
      particles.spawnCashSparkle(this.x + 8, this.y - 8);
      particles.spawnCashSparkle(this.x - 8, this.y + 8);
    }

    if (!GameState.currentRun) return;

    // c6 血腥盛宴 (擊殺流血目標吸血)
    if (this.bleedTimer > 0 && GameState.currentRun.activeBoons.includes('c6')) {
      player.hp = Math.min(player.maxHp, player.hp + 6);
      particles.addDamageText(player.x, player.y, '+6 HP', '#2ecc71', true);
    }

    // p2 混亂假面舞會 (死亡爆發面具彈幕)
    if (GameState.currentRun.activeBoons.includes('p2')) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        projectiles.spawnBullet(this.x, this.y, a, 320, 40, true, '#e040fb', true, 2, 'shock');
      }
    }

    // r5 命運輪盤大劫案 (每擊殺 5 怪爆發 24 顆反彈籌碼)
    if (GameState.currentRun.activeBoons.includes('r5') && GameState.currentRun.kills % 5 === 0) {
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        projectiles.spawnBullet(this.x, this.y, a, 360, 35, true, '#ffd700', true, 1, undefined, 'bullet', 4);
      }
      particles.addDamageText(this.x, this.y, '🎰 輪盤大滿貫！', '#ffd700', true);
      AudioManager.playCash();
    }

    // i2 連鎖殉爆 (被點燃擊殺引發大爆炸)
    if (this.burnTimer > 0 && GameState.currentRun.activeBoons.includes('i2')) {
      particles.spawnExplosion(this.x, this.y);
      projectiles.spawnHazardArea(this.x, this.y, 45, 1.5, 35, 'rgba(255, 69, 0, 0.5)', 'burn');
    }

    // k6 碎冰濺射 (擊殺凍結敵人向四周射出 8 顆冰錐)
    if (this.freezeTimer > 0 && GameState.currentRun.activeBoons.includes('k6')) {
      particles.spawnIceCrystals(this.x, this.y, 12);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        projectiles.spawnBullet(this.x, this.y, a, 450, 24, true, '#80d8ff', false, 2, 'freeze');
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (this.isDead) return;
    const px = this.x + offsetX;
    const py = this.y + offsetY;

    ctx.save();
    ctx.translate(px, py);

    // 菁英光環 (Elite Golden Aura)
    if (this.isElite) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 死亡標記特效 (c7)
    if (this.isMarked) {
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 前搖警示指示器
    if (this.state === 'windup') {
      if (this.info.tellType === 'yellow_exclamation') {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, -22);
      } else if (this.info.tellType === 'red_line' || this.info.aiArchetype === 'sniper') {
        ctx.strokeStyle = 'rgba(255, 30, 30, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.facingAngle) * 260, Math.sin(this.facingAngle) * 260);
        ctx.stroke();
      } else if (this.info.tellType === 'red_sector') {
        ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 110, this.facingAngle - 0.45, this.facingAngle + 0.45);
        ctx.closePath();
        ctx.fill();
      } else if (this.info.tellType === 'gas_smoke') {
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('毒', 0, -22);
      }
    }

    // 怪物本體 (受擊時觸發純白閃爍 Hit Flash，帶來極致打擊反饋)
    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = this.isFrozenSolid ? '#80d8ff' : this.info.color;
    }
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = (this.hitFlashTimer > 0) ? '#ffffff' : (this.isElite ? '#ffd700' : (this.shockTimer > 0 ? '#00e5ff' : '#000000'));
    ctx.lineWidth = this.isElite ? 3 : 2;
    ctx.stroke();

    // 防暴重盾 (Shield Archetype) 正面鋼盾渲染
    if (this.info.aiArchetype === 'shield') {
      ctx.save();
      ctx.rotate(this.facingAngle);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(this.radius * 0.6, -16, 6, 32);
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.radius * 0.6, -16, 6, 32);
      ctx.restore();
    }

    // 眼睛與朝向
    ctx.fillStyle = '#ffffff';
    const eyeX = Math.cos(this.facingAngle) * (this.radius * 0.6);
    const eyeY = Math.sin(this.facingAngle) * (this.radius * 0.6);
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 動態受傷血條
    if (this.lastHitTimer > 0) {
      ctx.save();
      const barW = this.isElite ? 42 : 30;
      const barH = this.isElite ? 5 : 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(px - barW / 2, py - this.radius - 8, barW, barH);
      ctx.fillStyle = this.isElite ? '#ffd700' : (this.freezeTimer > 0 ? '#00e5ff' : '#ff3333');
      ctx.fillRect(px - barW / 2, py - this.radius - 8, barW * Math.max(0, this.hp / this.maxHp), barH);
      ctx.restore();
    }
  }
}


