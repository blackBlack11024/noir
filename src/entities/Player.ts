import { InputManager } from '../core/InputManager';
import { AudioManager } from '../core/AudioManager';
import { GameState } from '../core/GameState';
import { WEAPON_DATABASE, WeaponInfo } from '../data/WeaponDatabase';
import { ProjectileManager } from './Projectile';
import { ParticleSystem } from './ParticleSystem';
import { Enemy } from './Enemy';
import { Boss } from './Boss';

export class Player {
  public x: number = 270;
  public y: number = 750;
  public radius: number = 14;
  public speed: number = 220;
  public angle: number = -Math.PI / 2;

  public hp: number = 100;
  public maxHp: number = 100;
  public stamina: number = 3;
  public maxStamina: number = 3;
  private staminaTimer: number = 0;

  public isDodging: boolean = false;
  public dodgeTimer: number = 0;
  public dodgeDuration: number = 0.25;
  public dodgeCooldown: number = 0.4;
  private dodgeCooldownTimer: number = 0;
  private dodgeDirX: number = 0;
  private dodgeDirY: number = 0;

  public iFrames: number = 0;
  public hasShield: boolean = false;
  public hasUsedIceRevive: boolean = false;
  public hasUsedSafehouseRevive: boolean = false;

  // 狂暴/特技 Buff 狀態
  public berserkTimer: number = 0;
  public ironFortressTimer: number = 0;
  public stealthTimer: number = 0;
  public goldFrenzyTimer: number = 0;
  public quickSwapBuffTimer: number = 0;
  public stillTimer: number = 0;

  // 雙武器槽
  public primaryWeaponId: number = 1;
  public secondaryWeaponId: number = 3;
  public currentSlot: 0 | 1 = 0;
  public primaryAmmo: number = 6;
  public secondaryAmmo: number = 6;

  public isReloading: boolean = false;
  public reloadProgress: number = 0;
  public reloadDuration: number = 0.9;

  public lightAttackCooldown: number = 0;
  public isChargingHeavy: boolean = false;
  public chargeTimer: number = 0;
  public skillCooldownTimer: number = 0;

  // 近戰三段連招與實體刀刃動態
  public meleeComboStep: number = 0; // 0, 1, 2 (三段連擊)
  public meleeComboResetTimer: number = 0;
  public meleeSwingTimer: number = 0;
  public meleeSwingDuration: number = 0.16;
  public meleeSwingAngleStart: number = 0;
  public meleeSwingAngleEnd: number = 0;
  public meleeBladeLength: number = 42;
  public meleeLungeVx: number = 0;
  public meleeLungeVy: number = 0;

  // 天賦倍率
  public speedMult: number = 1.0;
  public damageMult: number = 1.0;
  public reloadSpeedMult: number = 1.0;
  public heavyChargeSpeedMult: number = 1.0;
  public damageReduction: number = 0.0;

  // 頂級機制神賜 (衛星飛刀 / 自律僚機 / 暗影分身 / 時空子彈時間 / 輪盤 / 私酒 / 電影)
  public orbitBladeAngle: number = 0;
  public droneShootTimer: number = 0;
  public bulletTimeTimer: number = 0;
  public perfectDodgeBuffTimer: number = 0;
  public shotCounter: number = 0;
  public drunkenFrenzyTimer: number = 0;
  public filmReelUsed: boolean = false;
  public timeRewindCooldown: number = 0;
  public lastDamageAmount: number = 0;
  public activeSummonedDrones: number = 0;
  public shadowClones: { x: number; y: number; angle: number; alpha: number; duration: number }[] = [];

  // 防暴鋼盾專屬機制 (輕攻按住舉盾防禦 + 重攻擊滑行衝刺 + 格擋子彈增傷)
  public isHoldingShield: boolean = false;
  public shieldHoldTimer: number = 0;
  public shieldBlockedBulletsCount: number = 0;
  public shieldRushTimer: number = 0;
  public shieldRushVx: number = 0;
  public shieldRushVy: number = 0;
  public shieldRushDamage: number = 0;
  public shieldRushHitEnemies: Set<Enemy> = new Set();

  constructor() {
    this.resetFromState();
  }

  public resetFromState() {
    if (GameState.currentRun) {
      this.hp = GameState.currentRun.hp;
      this.maxHp = GameState.currentRun.maxHp;
      this.primaryWeaponId = GameState.currentRun.primaryWeaponId;
      this.secondaryWeaponId = GameState.currentRun.secondaryWeaponId;
      this.currentSlot = GameState.currentRun.currentWeaponSlot;
      this.primaryAmmo = GameState.currentRun.primaryAmmo;
      this.secondaryAmmo = GameState.currentRun.secondaryAmmo;

      // v6 電磁護盾
      if (GameState.currentRun.activeBoons.includes('v6')) {
        this.hasShield = true;
      }
    }
  }

  public getTotalDroneCount(): number {
    let count = this.activeSummonedDrones || 0;
    if (GameState.currentRun) {
      if (GameState.currentRun.activeBoons.includes('e1')) count += 1;
      if (GameState.currentRun.activeBoons.includes('e2')) count += 1;
      if (GameState.currentRun.activeBoons.includes('e9')) count += 2;
      if (GameState.currentRun.activeBoons.includes('syn10')) count += 1;
      if (GameState.currentRun.activeBoons.includes('v9')) count += 1;
    }
    if (this.getCurrentWeapon().id === 16 && count === 0) {
      count = 1;
    }
    return Math.min(8, count);
  }

  public getCurrentWeapon(): WeaponInfo {
    const id = this.currentSlot === 0 ? this.primaryWeaponId : this.secondaryWeaponId;
    return WEAPON_DATABASE[id] || WEAPON_DATABASE[1];
  }

  public getAmmo(): number {
    return this.currentSlot === 0 ? this.primaryAmmo : this.secondaryAmmo;
  }

  public setAmmo(amount: number) {
    if (this.currentSlot === 0) {
      this.primaryAmmo = amount;
      if (GameState.currentRun) GameState.currentRun.primaryAmmo = amount;
    } else {
      this.secondaryAmmo = amount;
      if (GameState.currentRun) GameState.currentRun.secondaryAmmo = amount;
    }
  }

  public getVisionStats(): { range: number; angle: number; ambientRadius: number } {
    // 若為 BOSS 戰房間，給予全局開闊明亮的對決視野
    if (GameState.currentRun && GameState.currentRun.roomIndex === 4) {
      return { range: 680, angle: Math.PI * 2, ambientRadius: 460 };
    }

    const w = this.getCurrentWeapon();
    const isMelee = (w.category === 'melee' || (w.category === 'heavy' && w.maxAmmo === 0));

    if (isMelee) {
      // 1. 近戰神兵 (手杖劍/砍刀/跳刀/指虎/鋼盾)：360度直覺感知，近身全方位圓形視野 (半徑 280px)
      return { range: 280, angle: Math.PI * 2, ambientRadius: 280 };
    }

    if (w.id === 13) {
      // 2. 栓動狙擊步槍：超遠狙擊鏡直線光束死線 (視野長度 720px，狹長 28度 聚焦)
      return { range: 720, angle: 0.48, ambientRadius: 100 };
    }

    if (w.id === 7 || w.id === 23) {
      // 3. 突擊卡賓槍 / 和平捍衛者：長程精準探照 (長度 560px，45度 視錐)
      return { range: 560, angle: 0.78, ambientRadius: 120 };
    }

    if (w.category === 'heavy' || w.id === 4 || w.id === 6) {
      // 4. 霰彈槍 / 噴火槍：超寬壓迫扇形照明 (長度 340px，100度 超寬扇形)
      return { range: 340, angle: 1.75, ambientRadius: 140 };
    }

    if (w.category === 'automatic' || w.id === 8 || w.id === 20) {
      // 5. 衝鋒槍 / 毒氣槍：中距離均勻掃射光錐 (長度 400px，75度 視錐)
      return { range: 400, angle: 1.3, ambientRadius: 125 };
    }

    // 6. 經典左輪 / 手槍：標準手電筒探照 (長度 440px，60度 視錐)
    return { range: 440, angle: 1.05, ambientRadius: 125 };
  }

  public update(dt: number, enemies: Enemy[], boss: Boss | null, projectiles: ProjectileManager, particles: ParticleSystem) {
    this.applyBoonBuffs(enemies);

    if (this.berserkTimer > 0) this.berserkTimer -= dt;
    if (this.ironFortressTimer > 0) this.ironFortressTimer -= dt;
    if (this.quickSwapBuffTimer > 0) this.quickSwapBuffTimer -= dt;
    if (this.drunkenFrenzyTimer > 0) this.drunkenFrenzyTimer -= dt;
    if (this.bulletTimeTimer > 0) this.bulletTimeTimer -= dt;
    if (this.perfectDodgeBuffTimer > 0) this.perfectDodgeBuffTimer -= dt;
    if (this.timeRewindCooldown > 0) this.timeRewindCooldown -= dt;
    if (this.stealthTimer > 0) {
      this.stealthTimer -= dt;
      this.iFrames = Math.max(this.iFrames, 0.1);
    }
    if (this.goldFrenzyTimer > 0) {
      this.goldFrenzyTimer -= dt;
      this.iFrames = Math.max(this.iFrames, 0.1);
    }

    // 瞄準角度 (鼠標直瞄或移動端智慧自動鎖敵)
    if (InputManager.isTouchDevice) {
      let foundTarget = false;
      if (InputManager.touchAttack || InputManager.touchCharge || InputManager.touchSkill) {
        let closestDist = 420;
        let targetX = 0;
        let targetY = 0;

        if (boss && !boss.isDead) {
          const bd = Math.hypot(boss.x - this.x, boss.y - this.y);
          if (bd < closestDist) {
            closestDist = bd;
            targetX = boss.x;
            targetY = boss.y;
            foundTarget = true;
          }
        }

        for (const e of enemies) {
          if (e.isDead) continue;
          const ed = Math.hypot(e.x - this.x, e.y - this.y);
          if (ed < closestDist) {
            closestDist = ed;
            targetX = e.x;
            targetY = e.y;
            foundTarget = true;
          }
        }

        if (foundTarget) {
          this.angle = Math.atan2(targetY - this.y, targetX - this.x);
        }
      }

      if (!foundTarget) {
        const move = InputManager.getMovementVector();
        if (move.x !== 0 || move.y !== 0) {
          this.angle = Math.atan2(move.y, move.x);
        } else {
          const dx = InputManager.mouseX - this.x;
          const dy = InputManager.mouseY - this.y;
          this.angle = Math.atan2(dy, dx);
        }
      }
    } else {
      const dx = InputManager.mouseX - this.x;
      const dy = InputManager.mouseY - this.y;
      this.angle = Math.atan2(dy, dx);
    }

    // 精力回復
    if (this.stamina < this.maxStamina) {
      this.staminaTimer += dt;
      if (this.staminaTimer >= 0.75) {
        this.stamina = Math.min(this.maxStamina, this.stamina + 1);
        this.staminaTimer = 0;
      }
    }

    // 計時與冷卻
    if (this.iFrames > 0) this.iFrames -= dt;
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= dt;
    if (this.lightAttackCooldown > 0) this.lightAttackCooldown -= dt;
    if (this.skillCooldownTimer > 0) this.skillCooldownTimer -= dt;

    // 近戰連招重設計時
    if (this.meleeComboResetTimer > 0) {
      this.meleeComboResetTimer -= dt;
      if (this.meleeComboResetTimer <= 0) {
        this.meleeComboStep = 0;
      }
    }

    // 近戰突進位移
    if (this.meleeSwingTimer > 0) {
      this.meleeSwingTimer -= dt;
      this.x += this.meleeLungeVx * dt;
      this.y += this.meleeLungeVy * dt;
      this.meleeLungeVx *= 0.82;
      this.meleeLungeVy *= 0.82;
    }

    // 翻滾狀態
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      this.x += this.dodgeDirX * 470 * dt;
      this.y += this.dodgeDirY * 470 * dt;

      // i3 焦土步法 (翻滾火海)
      if (GameState.currentRun && GameState.currentRun.activeBoons.includes('i3')) {
        projectiles.spawnHazardArea(this.x, this.y, 22, 2.5, 20, 'rgba(255, 69, 0, 0.45)', 'burn');
      }

      // j6 衝撞先鋒 (翻滾碰撞敵人擊退並眩暈)
      if (GameState.currentRun && GameState.currentRun.activeBoons.includes('j6')) {
        for (const e of enemies) {
          if (e.isDead) continue;
          const edx = e.x - this.x;
          const edy = e.y - this.y;
          if (Math.sqrt(edx * edx + edy * edy) < this.radius + e.radius + 10) {
            e.takeDamage(20, particles);
            e.staggerTimer = 0.5;
            e.state = 'stagger';
            e.x += Math.cos(this.angle) * 60;
            e.y += Math.sin(this.angle) * 60;
          }
        }
      }

      particles.particles.push({
        x: this.x,
        y: this.y,
        vx: 0,
        vy: 0,
        life: 0.15,
        maxLife: 0.15,
        color: 'rgba(212, 175, 55, 0.4)',
        size: 14,
        shape: 'circle'
      });

      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
      }
      this.clampPosition();
      return;
    }

    // 換彈中
    if (this.isReloading) {
      this.reloadProgress += dt;
      if (this.reloadProgress >= this.reloadDuration) {
        const weapon = this.getCurrentWeapon();
        this.setAmmo(weapon.maxAmmo);
        this.isReloading = false;
        this.reloadProgress = 0;
        AudioManager.playReload();

        // j3 戰術換彈煙幕 (換彈釋放擊退煙霧)
        if (GameState.currentRun && GameState.currentRun.activeBoons.includes('j3')) {
          particles.spawnSmoke(this.x, this.y, 16, 'rgba(200, 200, 200, 0.6)');
          for (const e of enemies) {
            if (e.isDead) continue;
            const edx = e.x - this.x;
            const edy = e.y - this.y;
            const dist = Math.sqrt(edx * edx + edy * edy);
            if (dist < 90) {
              e.x += (edx / dist) * 70;
              e.y += (edy / dist) * 70;
            }
          }
        }
      }
    }

    // 衛星飛刀風暴運算 (k6 / syn5)
    if (GameState.currentRun && (GameState.currentRun.activeBoons.includes('k6') || GameState.currentRun.activeBoons.includes('syn5'))) {
      this.orbitBladeAngle += dt * 4.8;
      const bladeRadius = 55;
      for (let bi = 0; bi < 4; bi++) {
        const ba = this.orbitBladeAngle + (bi * Math.PI / 2);
        const bx = this.x + Math.cos(ba) * bladeRadius;
        const by = this.y + Math.sin(ba) * bladeRadius;

        for (const e of enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - bx, e.y - by) < e.radius + 14) {
            e.takeDamage(16, particles, 'bleed', false, ba);
            particles.spawnElectricSparks(bx, by, 3);
          }
        }
        if (boss && !boss.isDead && Math.hypot(boss.x - bx, boss.y - by) < boss.radius + 14) {
          boss.takeDamage(16, particles);
        }

        for (let pi = projectiles.list.length - 1; pi >= 0; pi--) {
          const p = projectiles.list[pi];
          if (!p.isPlayer && !p.isAreaHazard && Math.hypot(p.x - bx, p.y - by) < p.radius + 14) {
            AudioManager.playParry();
            particles.spawnElectricSparks(bx, by, 8);
            if (GameState.currentRun.activeBoons.includes('syn5')) {
              p.isPlayer = true;
              p.vx = -p.vx * 2.2;
              p.vy = -p.vy * 2.2;
              p.damage *= 2.5;
              p.color = '#00ffff';
            } else {
              projectiles.list.splice(pi, 1);
            }
          }
        }
      }
    }

    // 自律防衛僚機編隊運算 (e1, e2, e9, syn10, v9)
    let droneCount = 0;
    if (GameState.currentRun) {
      if (GameState.currentRun.activeBoons.includes('e1')) droneCount += 1;
      if (GameState.currentRun.activeBoons.includes('e2')) droneCount += 1;
      if (GameState.currentRun.activeBoons.includes('e9')) droneCount += 2;
      if (GameState.currentRun.activeBoons.includes('syn10')) droneCount += 1;
      if (GameState.currentRun.activeBoons.includes('v9')) droneCount += 1;
    }

    if (droneCount > 0) {
      this.droneShootTimer -= dt;
      if (this.droneShootTimer <= 0) {
        this.droneShootTimer = GameState.currentRun?.activeBoons.includes('e10') ? 0.45 : 0.85;
        for (let di = 0; di < droneCount; di++) {
          const da = (Date.now() / 600) + di * (Math.PI * 2 / droneCount);
          const dx = this.x + Math.cos(da) * 42;
          const dy = this.y + Math.sin(da) * 42;

          let closestTarget: any = null;
          let minD = 360;
          if (boss && !boss.isDead) {
            closestTarget = boss;
            minD = Math.hypot(boss.x - dx, boss.y - dy);
          }
          for (const e of enemies) {
            if (e.isDead) continue;
            const ed = Math.hypot(e.x - dx, e.y - dy);
            if (ed < minD) {
              minD = ed;
              closestTarget = e;
            }
          }
          if (closestTarget) {
            const targetAngle = Math.atan2(closestTarget.y - dy, closestTarget.x - dx);
            const isLaser = GameState.currentRun?.activeBoons.includes('e5');
            const droneDmg = isLaser ? 45 : 28;
            projectiles.spawnBullet(dx, dy, targetAngle, 650, droneDmg, true, '#00e5ff', false, isLaser ? 4 : 1, 'shock', isLaser ? 'sniper_beam' : 'bullet');
            particles.spawnMuzzleFlash(dx, dy, targetAngle, '#00e5ff');
            AudioManager.playShot('revolver');
          }
        }
      }

      // e2 無人機機身攔截敵方子彈
      if (GameState.currentRun?.activeBoons.includes('e2')) {
        for (let di = 0; di < droneCount; di++) {
          const da = (Date.now() / 600) + di * (Math.PI * 2 / droneCount);
          const dx = this.x + Math.cos(da) * 42;
          const dy = this.y + Math.sin(da) * 42;

          for (let pi = projectiles.list.length - 1; pi >= 0; pi--) {
            const p = projectiles.list[pi];
            if (!p.isPlayer && !p.isAreaHazard && Math.hypot(p.x - dx, p.y - dy) < 24) {
              projectiles.list.splice(pi, 1);
              particles.spawnElectricSparks(dx, dy, 6);
              AudioManager.playParry();
              break;
            }
          }
        }
      }
    }

    // 暗影分身壽命衰減
    for (let ci = this.shadowClones.length - 1; ci >= 0; ci--) {
      const cl = this.shadowClones[ci];
      cl.alpha -= dt * 2.5;
      if (cl.alpha <= 0) {
        this.shadowClones.splice(ci, 1);
      }
    }

    // 盾牌狂暴滑行衝刺 (Shield Rush Slide)
    if (this.shieldRushTimer > 0) {
      this.shieldRushTimer -= dt;
      this.x += this.shieldRushVx * dt;
      this.y += this.shieldRushVy * dt;
      this.clampPosition();
      this.iFrames = Math.max(this.iFrames, 0.1);
      particles.spawnSmoke(this.x, this.y, 2, '#4682b4');
      particles.spawnElectricSparks(this.x, this.y, 2);

      // 碾碎路徑子彈
      for (let pi = projectiles.list.length - 1; pi >= 0; pi--) {
        const p = projectiles.list[pi];
        if (!p.isPlayer && !p.isAreaHazard && Math.hypot(p.x - this.x, p.y - this.y) < 55) {
          projectiles.list.splice(pi, 1);
          AudioManager.playParry();
        }
      }

      // 單次精準撞擊路徑敵人並附加超強擊退與二段撞牆傷害
      for (const e of enemies) {
        if (e.isDead) continue;
        if (!this.shieldRushHitEnemies.has(e) && Math.hypot(e.x - this.x, e.y - this.y) < 52) {
          this.shieldRushHitEnemies.add(e);
          // 1. 初次盾撞傷害 (Initial Impact)
          e.takeDamage(this.shieldRushDamage, particles, 'shock', true);
          particles.addDamageText(e.x, e.y, '盾牌重擊！', '#00e5ff', true);
          // 2. 超強物理擊退 + 預存撞牆二段碎骨傷害
          e.knockbackVx = Math.cos(this.angle) * 850;
          e.knockbackVy = Math.sin(this.angle) * 850;
          e.wallSplatPendingDmg = this.shieldRushDamage * 0.95;
          e.staggerTimer = 0.8;
          e.state = 'stagger';
          AudioManager.playHit();
          InputManager.haptic([30, 60]);
        }
      }
      if (boss && !boss.isDead && Math.hypot(boss.x - this.x, boss.y - this.y) < 60) {
        boss.takeDamage(this.shieldRushDamage * 1.2, particles);
      }
    }

    // 移動走位 (舉盾時移動速度降低 55%)
    const move = InputManager.getMovementVector();
    if (move.x !== 0 || move.y !== 0) {
      const bSpeed = this.berserkTimer > 0 ? 1.4 : 1.0;
      const shieldSpeedMod = this.isHoldingShield ? 0.45 : 1.0;
      this.x += move.x * this.speed * this.speedMult * bSpeed * shieldSpeedMod * dt;
      this.y += move.y * this.speed * this.speedMult * bSpeed * shieldSpeedMod * dt;
      this.stillTimer = 0;
    } else {
      this.stillTimer += dt;
    }
    this.clampPosition();

    // 觸發翻滾 (舉盾防禦期間禁止翻滾衝刺)
    if ((InputManager.isKeyJustPressed('Space') || InputManager.isKeyJustPressed('ShiftLeft') || InputManager.isSwiping) && !this.isHoldingShield) {
      this.tryDodge(move, enemies, projectiles, particles);
    }

    // 換彈
    if (InputManager.isKeyJustPressed('KeyR') || InputManager.touchReload) {
      this.startReload();
    }

    // 雙武器秒切
    if (InputManager.isKeyJustPressed('KeyQ') || InputManager.touchSwap) {
      this.swapWeapon();
    }

    // 釋放特技
    if (InputManager.isKeyJustPressed('KeyE') || InputManager.touchSkill) {
      this.triggerSkill(enemies, boss, projectiles, particles);
    }

    // 戰鬥處理 (輕攻 / 重攻)
    this.handleCombat(dt, enemies, boss, projectiles, particles);
  }

  private tryDodge(move: { x: number; y: number }, enemies: Enemy[], projectiles: ProjectileManager, particles: ParticleSystem) {
    if (this.isHoldingShield) return; // 舉盾防禦狀態下無法翻滾衝刺
    if (this.stamina >= 1 && this.dodgeCooldownTimer <= 0 && !this.isDodging) {
      this.stamina -= 1;
      this.isDodging = true;
      this.dodgeTimer = this.dodgeDuration;
      this.dodgeCooldownTimer = this.dodgeCooldown;
      this.iFrames = this.dodgeDuration;

      // 1. 動作後搖取消 (Dash Cancelling - 極速取消揮刀硬直與蓄力)
      this.meleeSwingTimer = 0;
      this.isChargingHeavy = false;
      this.chargeTimer = 0;
      this.lightAttackCooldown = 0;

      // 2. 極限閃避 (Perfect Dodge) 判定：擦身閃過 50px 內的敵方子彈或近身怪
      let isPerfect = false;
      for (const p of projectiles.list) {
        if (!p.isPlayer && !p.isAreaHazard && Math.hypot(p.x - this.x, p.y - this.y) < 52) {
          isPerfect = true;
          break;
        }
      }
      if (!isPerfect) {
        for (const e of enemies) {
          if (!e.isDead && e.state === 'windup' && Math.hypot(e.x - this.x, e.y - this.y) < 70) {
            isPerfect = true;
            break;
          }
        }
      }

      if (isPerfect) {
        // 觸發時空慢動作子彈時間 (受局外 bulletTimeLevel 與 t1 / syn12 升級加成)
        const isChronoBoon = GameState.currentRun && (GameState.currentRun.activeBoons.includes('t1') || GameState.currentRun.activeBoons.includes('syn12'));
        this.bulletTimeTimer = (isChronoBoon ? 2.5 : 0.45) + (GameState.upgrades.bulletTimeLevel * 0.15);
        this.perfectDodgeBuffTimer = 2.5; // 下一次攻擊必定致命暴擊 +50% 增傷
        this.stamina = Math.min(this.maxStamina, this.stamina + 1); // 立即返還 1 點精力！
        AudioManager.playParry();
        InputManager.haptic([30, 90]);
        if (isChronoBoon) {
          particles.addDamageText(this.x, this.y - 25, '⏳ 時空慢動作！', '#00e5ff', true);
        }
      }

      if (move.x !== 0 || move.y !== 0) {
        this.dodgeDirX = move.x;
        this.dodgeDirY = move.y;
      } else {
        this.dodgeDirX = Math.cos(this.angle);
        this.dodgeDirY = Math.sin(this.angle);
      }

      // 冷血殺手執照 (Hitman): 翻滾無冷卻 + 原地幻影瞬移
      if (GameState.currentRun?.passport === 'hitman') {
        this.dodgeCooldownTimer = 0;
        this.shadowClones.push({ x: this.x, y: this.y, angle: this.angle, alpha: 0.8, duration: 0.8 });
      }

      // 機械狂徒執照 (Cyber Tinkerer): 翻滾自動佈設捕獸夾
      if (GameState.currentRun?.passport === 'cyber_tinkerer') {
        projectiles.spawnTrap(this.x, this.y, 60, true);
      }

      // c4 幻影殘影: 翻滾原地留下殘影吸引怪物仇恨 1.5 秒
      if (GameState.currentRun && GameState.currentRun.activeBoons.includes('c4')) {
        for (const e of enemies) {
          e.tauntX = this.x;
          e.tauntY = this.y;
          e.tauntTimer = 1.5;
        }
      }

      // v3 磁暴翻滾: 穿過所有敵人釋放高壓電擊
      if (GameState.currentRun && GameState.currentRun.activeBoons.includes('v3')) {
        for (const e of enemies) {
          if (e.isDead) continue;
          const edx = e.x - this.x;
          const edy = e.y - this.y;
          if (Math.sqrt(edx * edx + edy * edy) < 65) {
            e.takeDamage(25, new ParticleSystem(), 'shock', true);
          }
        }
      }

      // k3 寒霜足跡: 翻滾凍結路徑敵人 1.5 秒
      if (GameState.currentRun && GameState.currentRun.activeBoons.includes('k3')) {
        projectiles.spawnHazardArea(this.x, this.y, 28, 1.8, 15, 'rgba(0, 229, 255, 0.4)', 'freeze', true);
      }

      // e3 倒鉤捕獸夾
      if (GameState.currentRun && GameState.currentRun.activeBoons.includes('e3')) {
        projectiles.spawnTrap(this.x, this.y, 50, true);
      }

      // m1 / syn7 私酒翻滾醉步火海
      if (GameState.currentRun && (GameState.currentRun.activeBoons.includes('m1') || GameState.currentRun.activeBoons.includes('syn7'))) {
        particles.spawnSmoke(this.x, this.y, 12, 'rgba(139, 69, 19, 0.5)');
        if (GameState.currentRun.activeBoons.includes('syn7')) {
          projectiles.spawnHazardArea(this.x, this.y, 45, 3.0, 45, 'rgba(255, 69, 0, 0.6)', 'burn', true);
        }
      }
    }
  }

  public swapWeapon() {
    if (this.primaryWeaponId === this.secondaryWeaponId) {
      return;
    }
    this.currentSlot = this.currentSlot === 0 ? 1 : 0;
    if (GameState.currentRun) GameState.currentRun.currentWeaponSlot = this.currentSlot;
    this.isReloading = false;
    this.reloadProgress = 0;
    this.isChargingHeavy = false;
    this.chargeTimer = 0;
    this.meleeComboStep = 0;
    this.meleeSwingTimer = 0;
    this.quickSwapBuffTimer = 3.0; // 觸發雙槍秒切增傷 Buff

    // q3 後備自動裝填
    const curW = this.getCurrentWeapon();
    if (curW.maxAmmo > 0) {
      this.setAmmo(curW.maxAmmo);
    }

    // q8 動能秒切回流 (恢復 1 點翻滾精力)
    if (GameState.currentRun?.activeBoons.includes('q8')) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 1);
    }

    AudioManager.playReload();
    InputManager.haptic(15);
  }

  public startReload() {
    const weapon = this.getCurrentWeapon();
    if (weapon.maxAmmo > 0 && this.getAmmo() < weapon.maxAmmo && !this.isReloading) {
      this.isReloading = true;
      this.reloadProgress = 0;
      const reloadUpgradeMod = Math.max(0.4, 1.0 - GameState.upgrades.reloadSpeedLevel * 0.10);
      this.reloadDuration = weapon.reloadTime * this.reloadSpeedMult * reloadUpgradeMod;
      AudioManager.playReload();
    }
  }

  private handleCombat(dt: number, enemies: Enemy[], boss: Boss | null, projectiles: ProjectileManager, particles: ParticleSystem) {
    const weapon = this.getCurrentWeapon();

    if (weapon.maxAmmo > 0 && this.getAmmo() <= 0 && !this.isReloading) {
      this.startReload();
    }

    if (InputManager.isTouchDevice) {
      // 1. 手機端自動輕攻擊 (範圍內有敵人或 Boss 時自動開火/揮擊)
      if (!this.isReloading && this.lightAttackCooldown <= 0) {
        let hasTargetInRange = false;
        const maxRange = weapon.category === 'melee' ? 140 : 420;

        if (boss && !boss.isDead && Math.hypot(boss.x - this.x, boss.y - this.y) <= maxRange) {
          hasTargetInRange = true;
        } else {
          for (const e of enemies) {
            if (!e.isDead && Math.hypot(e.x - this.x, e.y - this.y) <= maxRange) {
              hasTargetInRange = true;
              break;
            }
          }
        }

        if (hasTargetInRange) {
          this.fireLightAttack(weapon, enemies, boss, projectiles, particles);
        }
      }

      // 2. 單指按住移動並蓄力，放開手指瞬間釋放重攻擊
      const isMovingTouch = InputManager.joystickActive || InputManager.touchCharge;
      if (isMovingTouch && !this.isReloading) {
        this.isChargingHeavy = true;
        this.chargeTimer += dt * this.heavyChargeSpeedMult;
      } else if (this.isChargingHeavy) {
        const chargeRatio = Math.min(1.0, this.chargeTimer / weapon.heavyChargeTime);
        if (chargeRatio >= 0.28) {
          this.fireHeavyAttack(weapon, chargeRatio, enemies, boss, projectiles, particles);
        }
        this.isChargingHeavy = false;
        this.chargeTimer = 0;
      }
    } else {
      // PC 端鍵鼠操作模式
      const isLmb = InputManager.isLmbDown;

      // 武器 9 防暴鋼盾警棍：輕攻擊 (左鍵) 按住為舉盾格擋防禦；短按/點擊為警棍短打揮擊
      if (weapon.id === 9) {
        if (isLmb && !this.isReloading) {
          this.shieldHoldTimer += dt;
          if (this.shieldHoldTimer > 0.08) {
            this.isHoldingShield = true;
            for (let i = projectiles.list.length - 1; i >= 0; i--) {
              const p = projectiles.list[i];
              if (!p.isPlayer && !p.isAreaHazard) {
                const dx = p.x - this.x;
                const dy = p.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 55) {
                  const pAngle = Math.atan2(dy, dx);
                  let diff = Math.abs(pAngle - this.angle);
                  if (diff > Math.PI) diff = Math.PI * 2 - diff;
                  if (diff < 1.2) {
                    projectiles.list.splice(i, 1);
                    AudioManager.playParry();
                    particles.spawnElectricSparks(p.x, p.y, 8);
                    this.shieldBlockedBulletsCount++;
                    particles.addDamageText(p.x, p.y, '格擋充能 +' + this.shieldBlockedBulletsCount, '#00e5ff', true);
                  }
                }
              }
            }
          }
        } else {
          if (this.shieldHoldTimer > 0 && this.shieldHoldTimer <= 0.16 && this.lightAttackCooldown <= 0 && !this.isReloading) {
            this.fireLightAttack(weapon, enemies, boss, projectiles, particles);
          }
          this.isHoldingShield = false;
          this.shieldHoldTimer = 0;
        }
      } else {
        this.isHoldingShield = false;
        this.shieldHoldTimer = 0;
        if (isLmb && this.lightAttackCooldown <= 0 && !this.isReloading) {
          this.fireLightAttack(weapon, enemies, boss, projectiles, particles);
        }
      }

      // 蓄力重攻擊 (右鍵)
      const isCharging = InputManager.isRmbDown;
      if (isCharging && !this.isReloading) {
        this.isChargingHeavy = true;
        this.chargeTimer += dt * this.heavyChargeSpeedMult;
      } else if (this.isChargingHeavy) {
        const chargeRatio = Math.min(1.0, this.chargeTimer / weapon.heavyChargeTime);
        if (chargeRatio >= 0.25) {
          this.fireHeavyAttack(weapon, chargeRatio, enemies, boss, projectiles, particles);
        }
        this.isChargingHeavy = false;
        this.chargeTimer = 0;
      }
    }
  }

  private fireLightAttack(weapon: WeaponInfo, enemies: Enemy[], boss: Boss | null, projectiles: ProjectileManager, particles: ParticleSystem) {
    const bAtkSpd = this.berserkTimer > 0 ? 0.6 : (this.goldFrenzyTimer > 0 ? 0.35 : 1.0);
    this.lightAttackCooldown = weapon.lightCooldown * bAtkSpd;

    let finalDmgMult = this.damageMult;
    let isCrit = false;

    // 武器 13 栓動狙擊：定點靜止 0.5 秒必定致命貫通暴擊
    if (weapon.id === 13 && this.stillTimer >= 0.5) {
      finalDmgMult *= 2.2;
      isCrit = true;
    }

    // 局外暴擊傷害強化
    const critBonus = 1.5 + GameState.upgrades.critDamageLevel * 0.15;

    // 極限閃避後反擊 (100% 暴擊 + 50% 增傷)
    if (this.perfectDodgeBuffTimer > 0) {
      finalDmgMult *= 1.5;
      isCrit = true;
      this.perfectDodgeBuffTimer = 0;
      particles.addDamageText(this.x, this.y, '極限反擊', '#00ffff', true);
    }

    // j2 致命末彈
    if (weapon.maxAmmo > 0 && this.getAmmo() === 1 && GameState.currentRun && GameState.currentRun.activeBoons.includes('j2')) {
      finalDmgMult *= (2.0 + critBonus * 0.5);
      isCrit = true;
    }
    // 浮士德惡魔契約 (Curse Pacts) 增幅與代價
    if (GameState.currentRun?.cursePacts) {
      if (GameState.currentRun.cursePacts.includes('pact_flesh')) {
        finalDmgMult *= 3.5;
        this.shotCounter = (this.shotCounter || 0) + 1;
        if (this.shotCounter % 4 === 0) {
          this.hp = Math.max(1, this.hp - 1);
          particles.spawnBlood(this.x, this.y, 4);
        }
      }
      if (GameState.currentRun.cursePacts.includes('pact_glass')) {
        finalDmgMult *= 4.0;
        isCrit = true;
      }
      if (GameState.currentRun.cursePacts.includes('pact_midas')) {
        const cashBonus = (GameState.currentRun.cash || 0) * 0.004;
        finalDmgMult *= (1 + cashBonus);
      }
    }

    const damage = weapon.damage * finalDmgMult;

    // 異常狀態 (包含乾冰琴酒 Buff)
    let statusEffect: 'bleed' | 'burn' | 'shock' | 'freeze' | undefined = undefined;
    if (GameState.currentRun) {
      if (GameState.currentRun.selectedCocktail === 'cryo_gin') statusEffect = 'freeze';
      if (GameState.currentRun.activeBoons.includes('c1') && Math.random() < 0.35) statusEffect = 'bleed';
      if (GameState.currentRun.activeBoons.includes('i1')) statusEffect = 'burn';
      if (GameState.currentRun.activeBoons.includes('k1')) statusEffect = 'freeze';
    }

    const isMelee = (weapon.category === 'melee' || (weapon.category === 'heavy' && weapon.maxAmmo === 0));

    if (isMelee) {
      this.executeUniqueMeleeLight(weapon, damage, statusEffect, isCrit, enemies, boss, projectiles, particles);
    } else {
      this.executeUniqueRangedLight(weapon, damage, statusEffect, isCrit, projectiles, particles);
    }
  }

  // === 9 大近戰武器完全獨立輕攻擊模組與連段收招系統 ===
  private executeUniqueMeleeLight(weapon: WeaponInfo, damage: number, statusEffect: any, isCrit: boolean, enemies: Enemy[], boss: Boss | null, projectiles: ProjectileManager, particles: ParticleSystem) {
    AudioManager.playSlash();
    InputManager.haptic(20);

    const maxCombo = weapon.comboMaxSteps || 3;
    const step = this.meleeComboStep;
    const isFinisher = (step + 1 >= maxCombo);

    if (isFinisher) {
      this.meleeComboStep = 0;
      this.meleeComboResetTimer = 0;
      const bAtkSpd = this.berserkTimer > 0 ? 0.6 : (this.goldFrenzyTimer > 0 ? 0.35 : 1.0);
      this.lightAttackCooldown = (weapon.comboCooldown || 0.4) * bAtkSpd;
    } else {
      this.meleeComboStep = step + 1;
      this.meleeComboResetTimer = 0.9;
    }

    this.meleeSwingTimer = this.meleeSwingDuration;

    let swingRange = 70;
    let knockback = 35;
    let hitDamage = damage;

    switch (weapon.id) {
      case 1: { // 1. 仕紳手杖劍：3 連擊 (直刺 -> 上撩 -> 360° 疾風圓舞斬)
        swingRange = 72;
        this.meleeBladeLength = 72;
        if (step === 0) {
          // 第 1 段：西洋劍極速直刺
          this.meleeSwingAngleStart = this.angle - 0.2;
          this.meleeSwingAngleEnd = this.angle + 0.2;
          this.meleeLungeVx = Math.cos(this.angle) * 340;
          this.meleeLungeVy = Math.sin(this.angle) * 340;
        } else if (step === 1) {
          // 第 2 段：反手斜撩斬
          this.meleeSwingAngleStart = this.angle + 1.1;
          this.meleeSwingAngleEnd = this.angle - 1.1;
          this.meleeLungeVx = Math.cos(this.angle) * 220;
          this.meleeLungeVy = Math.sin(this.angle) * 220;
        } else {
          // 第 3 段 (終結技)：360° 疾風圓舞斬
          this.meleeSwingAngleStart = this.angle - Math.PI;
          this.meleeSwingAngleEnd = this.angle + Math.PI;
          hitDamage *= 1.7;
          knockback = 55;
          particles.spawnMuzzleFlash(this.x + Math.cos(this.angle) * 30, this.y + Math.sin(this.angle) * 30, this.angle, '#d4af37');
        }
        break;
      }
      case 2: { // 2. 工頭破拆鎚：2 連擊 (泰坦縱劈 -> 180° 碎骨橫掃)
        swingRange = 100;
        this.meleeBladeLength = 100;
        if (step === 0) {
          knockback = 65;
          this.meleeSwingAngleStart = this.angle - 0.45;
          this.meleeSwingAngleEnd = this.angle + 0.45;
          this.meleeLungeVx = Math.cos(this.angle) * 220;
          this.meleeLungeVy = Math.sin(this.angle) * 220;
          hitDamage *= 1.25;
          particles.spawnExplosion(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60);
        } else {
          knockback = 90;
          this.meleeSwingAngleStart = this.angle - 1.6;
          this.meleeSwingAngleEnd = this.angle + 1.6;
          this.meleeLungeVx = Math.cos(this.angle) * 160;
          this.meleeLungeVy = Math.sin(this.angle) * 160;
          hitDamage *= 1.75;
          particles.spawnExplosion(this.x + Math.cos(this.angle) * 70, this.y + Math.sin(this.angle) * 70);
        }
        break;
      }
      case 5: { // 5. 黑曜跳刀：4 連擊 (左挑 -> 右刺 -> 雙刀十字 -> 影襲割喉)
        swingRange = 58;
        this.meleeBladeLength = 58;
        if (step === 0) {
          this.meleeSwingAngleStart = this.angle - 0.9;
          this.meleeSwingAngleEnd = this.angle + 0.3;
          this.meleeLungeVx = Math.cos(this.angle) * 350;
          this.meleeLungeVy = Math.sin(this.angle) * 350;
        } else if (step === 1) {
          this.meleeSwingAngleStart = this.angle + 0.9;
          this.meleeSwingAngleEnd = this.angle - 0.3;
          this.meleeLungeVx = Math.cos(this.angle) * 350;
          this.meleeLungeVy = Math.sin(this.angle) * 350;
        } else if (step === 2) {
          this.meleeSwingAngleStart = this.angle - 1.2;
          this.meleeSwingAngleEnd = this.angle + 1.2;
          this.meleeLungeVx = Math.cos(this.angle) * 380;
          this.meleeLungeVy = Math.sin(this.angle) * 380;
          hitDamage *= 1.4;
        } else {
          this.meleeSwingAngleStart = this.angle - 1.5;
          this.meleeSwingAngleEnd = this.angle + 1.5;
          statusEffect = 'bleed';
          hitDamage *= 2.0;
          isCrit = true;
          this.meleeLungeVx = Math.cos(this.angle) * 440;
          this.meleeLungeVy = Math.sin(this.angle) * 440;
        }
        break;
      }
      case 9: { // 9. 防暴鋼盾警棍：2 連擊 (正面盾推 -> 警棍重抽電擊)
        swingRange = 65;
        this.meleeBladeLength = 65;
        if (step === 0) {
          this.meleeSwingAngleStart = this.angle - 0.7;
          this.meleeSwingAngleEnd = this.angle + 0.7;
          knockback = 50;
          this.meleeLungeVx = Math.cos(this.angle) * 260;
          this.meleeLungeVy = Math.sin(this.angle) * 260;
        } else {
          this.meleeSwingAngleStart = this.angle - 0.3;
          this.meleeSwingAngleEnd = this.angle + 0.3;
          statusEffect = 'shock';
          hitDamage *= 1.6;
          knockback = 65;
          particles.spawnElectricSparks(this.x + Math.cos(this.angle) * 40, this.y + Math.sin(this.angle) * 40, 10);
        }
        break;
      }
      case 11: { // 11. 精鋼指虎：5 連擊 (刺拳 -> 直拳 -> 擺拳 -> 腹勾 -> 爆炎升龍拳)
        swingRange = 52;
        this.meleeBladeLength = 52;
        if (step === 0) {
          this.meleeSwingAngleStart = this.angle - 0.15;
          this.meleeSwingAngleEnd = this.angle + 0.15;
          this.meleeLungeVx = Math.cos(this.angle) * 300;
          this.meleeLungeVy = Math.sin(this.angle) * 300;
        } else if (step === 1) {
          this.meleeSwingAngleStart = this.angle + 0.15;
          this.meleeSwingAngleEnd = this.angle - 0.15;
          this.meleeLungeVx = Math.cos(this.angle) * 320;
          this.meleeLungeVy = Math.sin(this.angle) * 320;
          hitDamage *= 1.15;
        } else if (step === 2) {
          this.meleeSwingAngleStart = this.angle - 0.8;
          this.meleeSwingAngleEnd = this.angle + 0.4;
          this.meleeLungeVx = Math.cos(this.angle) * 340;
          this.meleeLungeVy = Math.sin(this.angle) * 340;
          hitDamage *= 1.3;
        } else if (step === 3) {
          this.meleeSwingAngleStart = this.angle + 0.8;
          this.meleeSwingAngleEnd = this.angle - 0.4;
          this.meleeLungeVx = Math.cos(this.angle) * 360;
          this.meleeLungeVy = Math.sin(this.angle) * 360;
          hitDamage *= 1.5;
        } else {
          // 第 5 段終結技：升龍霸！
          this.meleeSwingAngleStart = this.angle - 0.25;
          this.meleeSwingAngleEnd = this.angle + 0.25;
          hitDamage *= 2.3;
          knockback = 85;
          this.meleeLungeVx = Math.cos(this.angle) * 420;
          this.meleeLungeVy = Math.sin(this.angle) * 420;
          particles.spawnMuzzleFlash(this.x + Math.cos(this.angle) * 35, this.y + Math.sin(this.angle) * 35, this.angle, '#ff1744');
          particles.spawnExplosion(this.x + Math.cos(this.angle) * 45, this.y + Math.sin(this.angle) * 45);
        }
        break;
      }
      case 14: { // 14. 荊棘毒藤鋼鞭：3 連擊 (縱劈 -> 橫掃 -> 360° 風暴絞殺)
        swingRange = 130;
        this.meleeBladeLength = 130;
        if (step === 0) {
          this.meleeSwingAngleStart = this.angle - 0.3;
          this.meleeSwingAngleEnd = this.angle + 0.3;
          this.meleeLungeVx = Math.cos(this.angle) * 160;
          this.meleeLungeVy = Math.sin(this.angle) * 160;
        } else if (step === 1) {
          this.meleeSwingAngleStart = this.angle - 1.5;
          this.meleeSwingAngleEnd = this.angle + 1.5;
          statusEffect = 'bleed';
          hitDamage *= 1.25;
        } else {
          // 終結技：360° 荊棘風暴絞殺 + 吸血
          this.meleeSwingAngleStart = this.angle - Math.PI;
          this.meleeSwingAngleEnd = this.angle + Math.PI;
          hitDamage *= 1.7;
          knockback = 50;
          statusEffect = 'bleed';
          this.hp = Math.min(this.maxHp, this.hp + 3);
          particles.spawnBlood(this.x, this.y, 12);
        }
        break;
      }
      case 15: { // 15. 屠夫開山鋸齒砍刀：3 連擊 (斜劈 -> 橫斬 -> 狂暴躍剁)
        swingRange = 88;
        this.meleeBladeLength = 88;
        if (step === 0) {
          this.meleeSwingAngleStart = this.angle - 1.3;
          this.meleeSwingAngleEnd = this.angle + 0.3;
          this.meleeLungeVx = Math.cos(this.angle) * 260;
          this.meleeLungeVy = Math.sin(this.angle) * 260;
        } else if (step === 1) {
          this.meleeSwingAngleStart = this.angle + 1.3;
          this.meleeSwingAngleEnd = this.angle - 0.3;
          this.meleeLungeVx = Math.cos(this.angle) * 280;
          this.meleeLungeVy = Math.sin(this.angle) * 280;
          hitDamage *= 1.3;
        } else {
          // 終結技：狂暴躍剁
          this.meleeSwingAngleStart = this.angle - 0.4;
          this.meleeSwingAngleEnd = this.angle + 0.4;
          hitDamage *= 1.9;
          knockback = 70;
          this.meleeLungeVx = Math.cos(this.angle) * 380;
          this.meleeLungeVy = Math.sin(this.angle) * 380;
          particles.spawnBlood(this.x + Math.cos(this.angle) * 50, this.y + Math.sin(this.angle) * 50, 20);
        }
        break;
      }
      case 21: { // 21. 戰術折疊工兵鏟：3 連擊 (橫削 -> 拍擊 -> 掘土揚沙)
        swingRange = 82;
        this.meleeBladeLength = 82;
        if (step === 0) {
          this.meleeSwingAngleStart = this.angle - 1.0;
          this.meleeSwingAngleEnd = this.angle + 1.0;
          knockback = 45;
        } else if (step === 1) {
          this.meleeSwingAngleStart = this.angle + 1.0;
          this.meleeSwingAngleEnd = this.angle - 1.0;
          knockback = 65;
          hitDamage *= 1.3;
        } else {
          // 終結技：掘土揚沙
          this.meleeSwingAngleStart = this.angle + 0.6;
          this.meleeSwingAngleEnd = this.angle - 0.6;
          knockback = 80;
          hitDamage *= 1.6;
          particles.spawnSmoke(this.x + Math.cos(this.angle) * 45, this.y + Math.sin(this.angle) * 45, 12, '#8b5a2b');
        }
        break;
      }
      case 24: { // 24. 死神黑鋼處刑重鐮：2 連擊 (巨弧勾割 -> 360° 死神狂暴大迴旋)
        swingRange = 115;
        this.meleeBladeLength = 115;
        if (step === 0) {
          this.meleeSwingAngleStart = this.angle - 1.6;
          this.meleeSwingAngleEnd = this.angle + 1.6;
          this.meleeLungeVx = Math.cos(this.angle) * 220;
          this.meleeLungeVy = Math.sin(this.angle) * 220;
          hitDamage *= 1.35;
          knockback = 50;
        } else {
          // 終結技：360° 死神狂暴大迴旋處決
          this.meleeSwingAngleStart = this.angle - Math.PI;
          this.meleeSwingAngleEnd = this.angle + Math.PI;
          this.meleeLungeVx = Math.cos(this.angle) * 280;
          this.meleeLungeVy = Math.sin(this.angle) * 280;
          hitDamage *= 2.0;
          knockback = 75;
          particles.spawnElectricSparks(this.x, this.y, 20);
        }
        break;
      }
      default: {
        swingRange = 70;
        this.meleeBladeLength = 70;
        this.meleeSwingAngleStart = this.angle - 1.2;
        this.meleeSwingAngleEnd = this.angle + 1.2;
        break;
      }
    }

    // 1. 切彈
    for (let i = projectiles.list.length - 1; i >= 0; i--) {
      const p = projectiles.list[i];
      if (!p.isPlayer) {
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < swingRange + 15) {
          const pAngle = Math.atan2(dy, dx);
          let diff = Math.abs(pAngle - this.angle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < 1.3) {
            projectiles.list.splice(i, 1);
            AudioManager.playParry();
            particles.spawnMuzzleFlash(p.x, p.y, this.angle, '#ffffff');
            particles.addDamageText(p.x, p.y, '切彈', '#ffd700', true);
          }
        }
      }
    }

    // 2. 近戰打擊敵人
    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= swingRange + e.radius) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(enemyAngle - this.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (angleDiff < 1.3) {
          e.x += Math.cos(this.angle) * knockback;
          e.y += Math.sin(this.angle) * knockback;
          e.x = Math.max(40, Math.min(500, e.x));
          e.y = Math.max(90, Math.min(870, e.y));

          e.takeDamage(hitDamage, particles, statusEffect, isCrit, this.angle);
          this.triggerOnHitBoons(e.x, e.y, enemies, projectiles, isCrit);
        }
      }
    }

    // 3. 打擊 Boss
    if (boss && !boss.isDead) {
      const dx = boss.x - this.x;
      const dy = boss.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= swingRange + boss.radius) {
        boss.takeDamage(hitDamage, particles);
      }
    }

    const fx = this.x + Math.cos(this.angle) * (swingRange * 0.6);
    const fy = this.y + Math.sin(this.angle) * (swingRange * 0.6);
    particles.spawnMuzzleFlash(fx, fy, this.angle, weapon.color);
  }

  // === 15 大遠程與特殊神兵完全獨立輕攻擊模組 ===
  private executeUniqueRangedLight(weapon: WeaponInfo, damage: number, statusEffect: any, isCrit: boolean, projectiles: ProjectileManager, particles: ParticleSystem) {
    if (this.ironFortressTimer <= 0) {
      this.setAmmo(this.getAmmo() - 1);
    }
    const spawnX = this.x + Math.cos(this.angle) * 20;
    const spawnY = this.y + Math.sin(this.angle) * 20;

    switch (weapon.id) {
      case 3:   // 3. 改裝雙動左輪：高初速銀色重彈
      case 23: {// 23. 雙持黃金和平捍衛者
        AudioManager.playShot('revolver');
        InputManager.haptic(20);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 620, damage, true, weapon.color, isCrit, 1, statusEffect, 'bullet');
        particles.spawnMuzzleFlash(spawnX, spawnY, this.angle, '#ffffff');
        break;
      }
      case 4: { // 4. 截短雙管霰彈槍：6發扇形燃燒鉛彈
        AudioManager.playShot('shotgun');
        InputManager.haptic(35);
        for (let i = -2.5; i <= 2.5; i += 1.0) {
          const spread = i * 0.09;
          projectiles.spawnBullet(spawnX, spawnY, this.angle + spread, 500, damage * 0.32, true, '#ff9800', isCrit, 1, statusEffect, 'shotgun_pellet');
        }
        particles.spawnSmoke(spawnX, spawnY, 8, 'rgba(255, 255, 255, 0.7)');
        particles.spawnMuzzleFlash(spawnX, spawnY, this.angle, '#ff9800');
        break;
      }
      case 6: { // 6. 化學噴火槍：噴射扇形膨脹火舌流
        AudioManager.playShot('shotgun');
        InputManager.haptic(10);
        for (let i = -1; i <= 1; i++) {
          const spread = (Math.random() - 0.5) * 0.35;
          projectiles.spawnBullet(spawnX, spawnY, this.angle + spread, 380, damage * 0.45, true, '#ff3d00', isCrit, 3, 'burn', 'flame');
        }
        break;
      }
      case 7: { // 7. 刺刀卡賓步槍：高穿透綠色甲冑曳光彈
        AudioManager.playShot('revolver');
        InputManager.haptic(22);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 680, damage, true, '#76ff03', isCrit, 2, statusEffect, 'bullet');
        particles.spawnMuzzleFlash(spawnX, spawnY, this.angle, '#76ff03');
        break;
      }
      case 8:  // 8. 雙持短衝鋒
      case 20: {// 20. 黑金湯姆森：極速金色火線
        AudioManager.playShot('tommy');
        InputManager.haptic(12);
        const spread = (Math.random() - 0.5) * 0.14;
        projectiles.spawnBullet(spawnX, spawnY, this.angle + spread, 600, damage, true, '#ffd700', isCrit, 1, statusEffect, 'bullet');
        particles.spawnMuzzleFlash(spawnX, spawnY, this.angle, '#ffd700');
        break;
      }
      case 10: { // 10. 重型戰術十字弩：高速破甲鋼矢
        AudioManager.playShot('revolver');
        InputManager.haptic(25);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 720, damage, true, '#d4af37', isCrit, 2, statusEffect, 'crossbow_bolt');
        break;
      }
      case 12: { // 12. 炸藥桶與燃燒瓶：投擲旋轉引燃炸藥棒
        AudioManager.playShot('shotgun');
        InputManager.haptic(30);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 350, damage, true, '#ff1744', isCrit, 1, 'burn', 'dynamite');
        break;
      }
      case 13: { // 13. 栓動狙擊步槍：全屏超音速死光雷射
        AudioManager.playShot('revolver');
        InputManager.haptic(40);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 950, damage, true, '#00ffff', true, 4, statusEffect, 'sniper_beam');
        particles.spawnSmoke(spawnX, spawnY, 6, 'rgba(0, 255, 255, 0.4)');
        break;
      }
      case 16: { // 16. 自律無人機控制器：引導開火 + 全場所有伴飛僚機同步齊射雙軌雷射！
        AudioManager.playShot('tommy');
        InputManager.haptic(18);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 720, damage * 0.7, true, '#00e5ff', isCrit, 2, 'shock', 'bullet');
        particles.spawnMuzzleFlash(spawnX, spawnY, this.angle, '#00e5ff');

        const droneCount = this.getTotalDroneCount();
        for (let di = 0; di < droneCount; di++) {
          const da = (Date.now() / 600) + di * (Math.PI * 2 / droneCount);
          const dx = this.x + Math.cos(da) * 45;
          const dy = this.y + Math.sin(da) * 45;
          projectiles.spawnBullet(dx, dy, this.angle, 720, damage * 0.75, true, '#00e5ff', isCrit, 2, 'shock', 'bullet');
          particles.spawnMuzzleFlash(dx, dy, this.angle, '#00e5ff');
          particles.spawnElectricSparks(dx, dy, 3);
        }
        break;
      }
      case 17: { // 17. 聲波管風琴音叉：音波震盪擴散紫環
        AudioManager.playShot('revolver');
        InputManager.haptic(20);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 420, damage, true, '#b388ff', isCrit, 3, 'shock', 'sonic_wave');
        break;
      }
      case 18: { // 18. 高壓冷凍乾冰噴槍：急凍冰霧與旋轉晶瑩冰晶
        AudioManager.playShot('shotgun');
        InputManager.haptic(15);
        for (let i = -1; i <= 1; i++) {
          const spread = (Math.random() - 0.5) * 0.28;
          projectiles.spawnBullet(spawnX, spawnY, this.angle + spread, 440, damage * 0.4, true, '#00e5ff', isCrit, 2, 'freeze', 'frost');
        }
        break;
      }
      case 19: { // 19. 手提轉輪加特林：三重旋轉重鉛彈幕
        AudioManager.playShot('tommy');
        InputManager.haptic(18);
        for (let i = -1; i <= 1; i++) {
          const spread = (Math.random() - 0.5) * 0.2;
          projectiles.spawnBullet(spawnX, spawnY, this.angle + spread, 620, damage * 0.4, true, '#90a4ae', isCrit, 1, statusEffect, 'bullet');
        }
        particles.spawnSmoke(spawnX, spawnY, 4);
        break;
      }
      case 22: { // 22. 毒氣榴彈發射器：拋物線綠色劇毒榴彈
        AudioManager.playShot('shotgun');
        InputManager.haptic(30);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 380, damage, true, '#00e676', isCrit, 1, 'bleed', 'grenade');
        break;
      }
      default: {
        AudioManager.playShot('revolver');
        InputManager.haptic(15);
        projectiles.spawnBullet(spawnX, spawnY, this.angle, 580, damage, true, weapon.color, isCrit, 1, statusEffect, 'bullet');
        particles.spawnMuzzleFlash(spawnX, spawnY, this.angle, '#ffd700');
        break;
      }
    }
  }

  // === 24 大神兵專屬蓄力重攻擊 (Heavy Attacks) ===
  private fireHeavyAttack(weapon: WeaponInfo, ratio: number, enemies: Enemy[], boss: Boss | null, projectiles: ProjectileManager, particles: ParticleSystem) {
    const damage = weapon.heavyDamage * ratio * this.damageMult;
    AudioManager.playExplosion();
    InputManager.haptic([30, 50, 30]);

    // 實體武器後坐力/位移反動 (向前突進或向後反衝震退)
    this.x += Math.cos(this.angle) * (weapon.heavyRecoil || 0);
    this.y += Math.sin(this.angle) * (weapon.heavyRecoil || 0);
    this.clampPosition();

    // 武器專屬後搖回彈收招時間 (受局外秒切與天賦減免)
    const recoveryMod = Math.max(0.35, 1.0 - GameState.upgrades.quickSwapLevel * 0.08);
    this.lightAttackCooldown = (weapon.heavyRecoveryTime || 0.25) * recoveryMod;

    // i5 莫洛托夫之怒 (重擊散落 3 顆小燃燒彈)
    if (GameState.currentRun && GameState.currentRun.activeBoons.includes('i5')) {
      for (let i = -1; i <= 1; i++) {
        const a = this.angle + i * 0.4;
        const fx = this.x + Math.cos(a) * 60;
        const fy = this.y + Math.sin(a) * 60;
        projectiles.spawnHazardArea(fx, fy, 28, 2.0, 25, 'rgba(255, 69, 0, 0.45)', 'burn');
      }
    }

    const isMelee = (weapon.category === 'melee' || (weapon.category === 'heavy' && weapon.maxAmmo === 0));

    if (isMelee) {
      // 9. 防暴鋼盾警棍專屬：短程盾衝滑行 + 格擋子彈增傷 (Shield Rush Slide)
      if (weapon.id === 9) {
        const empowerMult = 1.0 + Math.min(10, this.shieldBlockedBulletsCount) * 0.20;
        if (this.shieldBlockedBulletsCount > 0) {
          particles.addDamageText(this.x, this.y - 20, '充能盾衝 x' + empowerMult.toFixed(1), '#ffd700', true);
        }
        this.shieldBlockedBulletsCount = 0;
        this.shieldRushTimer = 0.18; // 短程爆發衝刺 (~115px)
        this.shieldRushVx = Math.cos(this.angle) * 650 * Math.max(0.6, ratio);
        this.shieldRushVy = Math.sin(this.angle) * 650 * Math.max(0.6, ratio);
        this.shieldRushDamage = damage * 1.5 * empowerMult;
        this.shieldRushHitEnemies.clear();
        particles.spawnSmoke(this.x, this.y, 8);
        particles.spawnElectricSparks(this.x, this.y, 10);
        InputManager.haptic([40, 80]);
        return;
      }

      this.meleeSwingTimer = 0.28;
      this.meleeBladeLength = 95;
      this.meleeSwingAngleStart = this.angle - Math.PI;
      this.meleeSwingAngleEnd = this.angle + Math.PI;

      this.meleeLungeVx = Math.cos(this.angle) * 450;
      this.meleeLungeVy = Math.sin(this.angle) * 450;

      const smashX = this.x + Math.cos(this.angle) * 50;
      const smashY = this.y + Math.sin(this.angle) * 50;
      particles.spawnExplosion(smashX, smashY);

      for (const e of enemies) {
        if (e.isDead) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          e.x += Math.cos(this.angle) * 90;
          e.y += Math.sin(this.angle) * 90;
          e.x = Math.max(40, Math.min(500, e.x));
          e.y = Math.max(90, Math.min(870, e.y));

          // c3 淬毒刀刃 (重擊流血怪引發毒霧)
          if (e.bleedTimer > 0 && GameState.currentRun && GameState.currentRun.activeBoons.includes('c3')) {
            projectiles.spawnHazardArea(e.x, e.y, 40, 2.5, 25, 'rgba(46, 204, 113, 0.45)', 'bleed');
          }

          // j8 破甲震波
          if (GameState.currentRun && GameState.currentRun.activeBoons.includes('j8')) {
            e.armorReduction = Math.max(e.armorReduction, 0.3);
          }

          // k2 極寒碎裂 (對冰凍敵人 200% 碎冰暴擊)
          const isFrozen = e.freezeTimer > 0;
          const finalDmg = isFrozen && GameState.currentRun && GameState.currentRun.activeBoons.includes('k2') ? damage * 2.0 : damage;

          e.takeDamage(finalDmg, particles, undefined, isFrozen, this.angle);
        }
      }

      if (boss && !boss.isDead) {
        const dx = boss.x - this.x;
        const dy = boss.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) < 140) {
          boss.takeDamage(damage, particles);
        }
      }
    } else {
      const spawnX = this.x + Math.cos(this.angle) * 20;
      const spawnY = this.y + Math.sin(this.angle) * 20;

      switch (weapon.id) {
        case 3: // 左輪：極速4連發扇形狂熱點射
        case 23: {
          for (let i = -1.5; i <= 1.5; i += 1.0) {
            projectiles.spawnBullet(spawnX, spawnY, this.angle + i * 0.12, 650, damage * 0.35, true, weapon.color, true, 1, undefined, 'bullet');
          }
          break;
        }
        case 4: { // 雙管霰彈：雙管齊鳴 12 顆爆裂鉛彈 + 後坐力後退
          for (let i = -5; i <= 5; i++) {
            projectiles.spawnBullet(spawnX, spawnY, this.angle + i * 0.08, 550, damage * 0.16, true, '#ff5722', true, 1, undefined, 'shotgun_pellet');
          }
          this.x -= Math.cos(this.angle) * 45;
          this.y -= Math.sin(this.angle) * 45;
          break;
        }
        case 6: { // 噴火槍：高壓火海爆發
          for (let i = -2; i <= 2; i++) {
            projectiles.spawnBullet(spawnX, spawnY, this.angle + i * 0.18, 420, damage * 0.25, true, '#ff3d00', true, 3, 'burn', 'flame');
          }
          projectiles.spawnHazardArea(spawnX + Math.cos(this.angle) * 60, spawnY + Math.sin(this.angle) * 60, 45, 3.0, 30, 'rgba(255, 69, 0, 0.5)', 'burn');
          break;
        }
        case 10: { // 重弩：穿透定身倒鉤弩
          projectiles.spawnBullet(spawnX, spawnY, this.angle, 780, damage * 1.5, true, '#ffd700', true, 5, undefined, 'crossbow_bolt');
          projectiles.spawnTrap(spawnX + Math.cos(this.angle) * 80, spawnY + Math.sin(this.angle) * 80);
          break;
        }
        case 12: { // 炸藥：拋出大號燃燒海
          projectiles.spawnHazardArea(spawnX + Math.cos(this.angle) * 80, spawnY + Math.sin(this.angle) * 80, 60, 3.5, 40, 'rgba(255, 69, 0, 0.6)', 'burn');
          break;
        }
        case 13: { // 狙擊：死線貫穿死光
          projectiles.spawnBullet(spawnX, spawnY, this.angle, 1200, damage * 1.6, true, '#00ffff', true, 8, undefined, 'sniper_beam');
          break;
        }
        case 16: { // 16. 自律無人機控制器：重攻擊蓄力召喚 1 架伴飛僚機！
          this.activeSummonedDrones = Math.min(6, (this.activeSummonedDrones || 0) + 1);
          particles.spawnElectricSparks(this.x, this.y, 25);
          particles.addDamageText(this.x, this.y - 30, `🤖 召喚伴飛僚機 (共 ${this.getTotalDroneCount()} 架)`, '#00e5ff', true);
          AudioManager.playShot('revolver');
          AudioManager.playParry();
          return;
        }
        case 17: { // 音叉：全屏共鳴音震
          for (let i = -2; i <= 2; i++) {
            projectiles.spawnBullet(spawnX, spawnY, this.angle + i * 0.35, 450, damage * 0.3, true, '#b388ff', true, 3, 'shock', 'sonic_wave');
          }
          break;
        }
        case 18: { // 乾冰：暴風雪急凍扇面
          for (let i = -3; i <= 3; i++) {
            projectiles.spawnBullet(spawnX, spawnY, this.angle + i * 0.15, 480, damage * 0.2, true, '#00e5ff', true, 3, 'freeze', 'frost');
          }
          break;
        }
        case 19: { // 加特林：8連重裝暴風雨
          for (let i = 0; i < 8; i++) {
            const spread = (Math.random() - 0.5) * 0.25;
            projectiles.spawnBullet(spawnX, spawnY, this.angle + spread, 650, damage * 0.18, true, '#78909c', true, 1, undefined, 'bullet');
          }
          break;
        }
        default: {
          projectiles.spawnBullet(spawnX, spawnY, this.angle, 650, damage, true, weapon.color, true, 5, undefined, 'bullet');
          break;
        }
      }
      particles.spawnExplosion(spawnX, spawnY);
    }
  }

  // 24 大神兵專屬獨立特技 (Unique Skills)
  public triggerSkill(enemies: Enemy[], boss: Boss | null, projectiles: ProjectileManager, particles: ParticleSystem) {
    const weapon = this.getCurrentWeapon();
    if (this.skillCooldownTimer > 0) return;

    this.skillCooldownTimer = weapon.skillCooldown;
    AudioManager.playExplosion();
    InputManager.haptic([40, 80]);

    // c7 死亡標記 (特技標記所有受擊敵人)
    if (GameState.currentRun && GameState.currentRun.activeBoons.includes('c7')) {
      for (const e of enemies) {
        e.isMarked = true;
        e.markTimer = 4.0;
      }
    }

    // v9 傳奇雷暴降臨 (特技引導全屏落雷)
    if (GameState.currentRun && GameState.currentRun.activeBoons.includes('v9')) {
      for (const e of enemies) {
        if (e.isDead) continue;
        particles.spawnElectricSparks(e.x, e.y, 14);
        e.takeDamage(90, particles, 'shock', true);
      }
      if (boss && !boss.isDead) {
        particles.spawnElectricSparks(boss.x, boss.y, 18);
        boss.takeDamage(90, particles);
      }
    }

    const wid = weapon.id;

    switch (wid) {
      case 1: // 仕紳手杖劍: 疾風圓舞斬 (360度迴旋斬+切斷子彈)
        this.meleeSwingTimer = 0.35;
        this.meleeBladeLength = 110;
        this.meleeSwingAngleStart = 0;
        this.meleeSwingAngleEnd = Math.PI * 2;
        projectiles.list = projectiles.list.filter(p => p.isPlayer);
        for (const e of enemies) {
          if (e.isDead) continue;
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d < 120) e.takeDamage(weapon.damage * 2.5 * this.damageMult, particles, 'bleed', true);
        }
        break;

      case 2: // 工頭破拆鎚: 地裂震波 (扇形碎石地裂)
        particles.spawnExplosion(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60);
        for (let i = -2; i <= 2; i++) {
          const a = this.angle + i * 0.18;
          projectiles.spawnBullet(this.x, this.y, a, 480, weapon.damage * 2.2, true, '#a37c48', true, 4);
        }
        break;

      case 3: // 改裝雙動左輪: 左輪速射 (極速六連後撤)
        this.x -= Math.cos(this.angle) * 80;
        this.y -= Math.sin(this.angle) * 80;
        this.clampPosition();
        for (let i = 0; i < 6; i++) {
          const spread = (Math.random() - 0.5) * 0.3;
          projectiles.spawnBullet(this.x, this.y, this.angle + spread, 620, weapon.damage * 1.3, true, '#c0c0c0', true, 1);
        }
        break;

      case 4: // 截短雙管霰彈槍: 環形煙幕轟殺 (360度全向高爆散彈 + 原地 5 秒戰術濃煙)
        AudioManager.playShot('shotgun');
        particles.spawnSmoke(this.x, this.y, 40, 'rgba(180, 185, 195, 0.8)', 120, 5.0, true);
        this.iFrames = 0.5;
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 560, weapon.damage * 1.8 * this.damageMult, true, '#ff9800', true, 2, undefined, 'bullet');
        }
        break;

      case 5: // 黑曜彈簧跳刀: 投擲毒飛刀 (扇形 3 發)
        for (let i = -1; i <= 1; i++) {
          projectiles.spawnBullet(this.x, this.y, this.angle + i * 0.22, 600, weapon.damage * 2.0, true, '#4a0e17', true, 3, 'bleed');
        }
        break;

      case 6: // 化學噴火槍: 爆震火浪 (全屏高壓火浪)
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 380, weapon.damage * 1.8, true, '#e25822', true, 999, 'burn');
        }
        projectiles.spawnHazardArea(this.x, this.y, 110, 3.0, 30, 'rgba(255, 69, 0, 0.45)', 'burn');
        break;

      case 7: // 刺刀卡賓步槍: 鋼纜抓鉤 (拉近遠處目標並擊暈)
        for (const e of enemies) {
          if (!e.isDead) {
            e.x = this.x + Math.cos(this.angle) * 50;
            e.y = this.y + Math.sin(this.angle) * 50;
            e.takeDamage(weapon.damage * 2.0, particles, 'shock', true);
            e.staggerTimer = 1.2;
            break;
          }
        }
        break;

      case 8: // 雙持短衝鋒: 幸運金幣破片彈 (8 破片彈跳手雷)
        particles.spawnExplosion(this.x + Math.cos(this.angle) * 100, this.y + Math.sin(this.angle) * 100);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          projectiles.spawnBullet(this.x + Math.cos(this.angle) * 100, this.y + Math.sin(this.angle) * 100, a, 400, weapon.damage * 1.5, true, '#ffd700', false, 2);
        }
        break;

      case 9: // 防暴鋼盾警棍: 高壓電磁脈衝 (局部 EMP 160px 範圍，癱瘓 1.2 秒)
        particles.spawnElectricSparks(this.x, this.y, 25);
        for (const e of enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - this.x, e.y - this.y) <= 160) {
            e.takeDamage(weapon.damage * 1.5, particles, 'shock', true);
            e.shockTimer = 1.2;
          }
        }
        if (boss && !boss.isDead && Math.hypot(boss.x - this.x, boss.y - this.y) <= 160) {
          boss.takeDamage(weapon.damage * 1.5, particles);
        }
        break;

      case 10: // 重型戰術十字弩: 捕獸夾陷阱網
        projectiles.spawnTrap(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60, weapon.damage * 2.5);
        break;

      case 11: { // 格鬥精鋼指虎: 升龍天翔破 (突進烈焰上勾拳)
        this.iFrames = 0.5;
        this.meleeSwingTimer = 0.35;
        this.meleeBladeLength = 80;
        this.meleeSwingAngleStart = this.angle - 0.4;
        this.meleeSwingAngleEnd = this.angle + 0.4;
        this.meleeLungeVx = Math.cos(this.angle) * 550;
        this.meleeLungeVy = Math.sin(this.angle) * 550;

        // 向前疾衝並嚴格邊界夾緊
        this.x += Math.cos(this.angle) * 110;
        this.y += Math.sin(this.angle) * 110;
        this.clampPosition();

        AudioManager.playCritHit();
        particles.spawnExplosion(this.x, this.y);
        particles.spawnElectricSparks(this.x, this.y, 16);
        particles.addDamageText(this.x, this.y - 20, '升龍天翔破！', '#ffd700', true);

        const skillDamage = weapon.damage * 4.0 * this.damageMult;

        for (const e of enemies) {
          if (e.isDead) continue;
          const edist = Math.hypot(e.x - this.x, e.y - this.y);
          if (edist < 95) {
            e.x += Math.cos(this.angle) * 75;
            e.y += Math.sin(this.angle) * 75;
            e.x = Math.max(40, Math.min(500, e.x));
            e.y = Math.max(90, Math.min(870, e.y));
            const actual = e.takeDamage(skillDamage, particles, undefined, true, this.angle);
            if (GameState.currentRun) GameState.currentRun.damageDealt += actual;
            this.triggerOnHitBoons(e.x, e.y, enemies, projectiles, true);
          }
        }

        if (boss && !boss.isDead) {
          const bdist = Math.hypot(boss.x - this.x, boss.y - this.y);
          if (bdist < 120) {
            boss.takeDamage(skillDamage, particles);
            if (GameState.currentRun) GameState.currentRun.damageDealt += skillDamage;
            boss.x += Math.cos(this.angle) * 20;
            boss.y += Math.sin(this.angle) * 20;
          }
        }
        break;
      }

      case 12: // 炸藥桶與燃燒瓶: 遙控黏性炸藥
        projectiles.spawnHazardArea(this.x + Math.cos(this.angle) * 90, this.y + Math.sin(this.angle) * 90, 80, 2.5, 45, 'rgba(255, 69, 0, 0.5)', 'burn');
        particles.spawnExplosion(this.x + Math.cos(this.angle) * 90, this.y + Math.sin(this.angle) * 90);
        break;

      case 13: // 栓動狙擊步槍: 煙幕戰術撤退 (獲得 2 秒隱蔽無敵)
        this.stealthTimer = 2.0;
        particles.spawnSmoke(this.x, this.y, 25);
        break;

      case 14: // 荊棘毒藤鋼鞭: 荊棘風暴 (周身連續抽打 3 圈)
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + (r * 0.4);
            projectiles.spawnBullet(this.x, this.y, a, 320 + r * 50, weapon.damage * 1.4, true, '#2e8b57', true, 2, 'bleed');
          }
        }
        break;

      case 15: // 屠夫開山鋸齒刀: 嗜血戰吼 (+40% 移速攻速 4 秒)
        this.berserkTimer = 4.0;
        particles.addDamageText(this.x, this.y, '嗜血戰吼！', '#ff1744', true);
        break;

      case 16: // 自律無人機: 自爆無人機
        if (enemies.length > 0) {
          const target = enemies[0];
          particles.spawnExplosion(target.x, target.y);
          target.takeDamage(weapon.damage * 4.0, particles, 'shock', true);
        }
        break;

      case 17: // 聲波管風琴音叉: 催眠音律
        for (const e of enemies) {
          e.takeDamage(weapon.damage * 1.8, particles, 'shock');
          e.staggerTimer = 2.0;
        }
        break;

      case 18: // 高壓冷凍乾冰噴槍: 全場急凍 2.5 秒
        particles.spawnIceCrystals(this.x, this.y, 40);
        for (const e of enemies) {
          e.takeDamage(weapon.damage * 1.5, particles, 'freeze', true);
          e.isFrozenSolid = true;
          e.freezeTimer = 2.5;
        }
        break;

      case 19: // 重型轉輪加特林: 鋼鐵堡壘展開
        this.ironFortressTimer = 3.5;
        particles.addDamageText(this.x, this.y, '鋼鐵堡壘！', '#ffd700', true);
        break;

      case 20: // 黑金湯姆森衝鋒槍: 教父終極處刑 (32 發黃金全屏彈幕)
        for (let i = 0; i < 32; i++) {
          const a = (i / 32) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 550, weapon.damage * 1.8, true, '#ffd700', true, 2);
        }
        break;

      case 21: // 戰術工兵鏟: 地下潛伏破土
        this.iFrames = 1.0;
        this.x += Math.cos(this.angle) * 120;
        this.y += Math.sin(this.angle) * 120;
        this.clampPosition();
        particles.spawnExplosion(this.x, this.y);
        for (const e of enemies) {
          if (Math.hypot(e.x - this.x, e.y - this.y) < 90) e.takeDamage(weapon.damage * 3.0, particles, undefined, true);
        }
        break;

      case 22: // 毒氣榴彈: 毒性連鎖引爆
        for (let i = -1; i <= 1; i++) {
          const gx = this.x + Math.cos(this.angle + i * 0.3) * 110;
          const gy = this.y + Math.sin(this.angle + i * 0.3) * 110;
          projectiles.spawnHazardArea(gx, gy, 45, 3.0, 35, 'rgba(46, 204, 113, 0.45)', 'bleed');
        }
        break;

      case 23: // 雙持和平捍衛者: 致命速射漫遊
        this.x += Math.cos(this.angle) * 100;
        this.y += Math.sin(this.angle) * 100;
        this.clampPosition();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 600, weapon.damage * 1.5, true, '#daa520', true, 2);
        }
        break;

      case 24: // 死神黑鋼處刑鐮: 靈魂收割 (巨型迴旋血鐮 + 擊中回血)
        projectiles.spawnBoomerang(this.x, this.y, this.angle, 420, weapon.damage * 2.8, '#ff1744');
        this.hp = Math.min(this.maxHp, this.hp + 12);
        particles.addDamageText(this.x, this.y, '+12 HP', '#2ecc71', true);
        break;

      default:
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          projectiles.spawnBullet(this.x, this.y, a, 420, weapon.damage * 1.6 * this.damageMult, true, weapon.color, true, 2);
        }
        break;
    }
  }

  private triggerOnHitBoons(x: number, y: number, enemies: Enemy[], projectiles: ProjectileManager, isCrit: boolean) {
    if (!GameState.currentRun) return;

    // v1 電弧跳躍
    if (GameState.currentRun.activeBoons.includes('v1')) {
      for (const other of enemies) {
        if (other.isDead) continue;
        const d = Math.hypot(other.x - x, other.y - y);
        if (d > 10 && d < 140) {
          other.takeDamage(18, new ParticleSystem(), 'shock');
          // v5 能量回充
          if (GameState.currentRun.activeBoons.includes('v5')) {
            this.skillCooldownTimer = Math.max(0, this.skillCooldownTimer - 0.4);
          }
          break;
        }
      }
    }

    // i9 傳奇末日火海 (暴擊召喚天降榴彈)
    if (isCrit && GameState.currentRun.activeBoons.includes('i9')) {
      projectiles.spawnHazardArea(x, y, 40, 2.0, 45, 'rgba(255, 69, 0, 0.5)', 'burn');
      new ParticleSystem().spawnExplosion(x, y);
    }

    // c10 傳奇靈魂撕裂 (暴擊額外觸發瞬影背刺)
    if (isCrit && GameState.currentRun.activeBoons.includes('c10')) {
      for (const other of enemies) {
        if (!other.isDead) {
          other.takeDamage(60, new ParticleSystem(), 'bleed', true);
          break;
        }
      }
    }

    // g7 鑲金彈藥 (暴擊額外掉落金幣)
    if (isCrit && GameState.currentRun.activeBoons.includes('g7')) {
      GameState.addCash(10);
    }
  }

  public takeDamage(amount: number, particles: ParticleSystem, sourceX?: number, sourceY?: number): boolean {
    if (this.iFrames > 0 || this.isDodging) return false;

    // 武器 9 防暴鋼盾警棍: 僅限正面視錐格擋！來自背後或側翼的傷害無法格擋！
    if (this.getCurrentWeapon().id === 9 && (this.isHoldingShield || this.shieldRushTimer > 0)) {
      let isFrontal = true;
      if (sourceX !== undefined && sourceY !== undefined) {
        const attackAngle = Math.atan2(sourceY - this.y, sourceX - this.x);
        let diff = Math.abs(attackAngle - this.angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        // 只有正面約 70 度視錐 (1.2 rad) 內才能被鋼盾擋下，背面/側面 (diff > 1.2) 破綻受創！
        if (diff > 1.2) {
          isFrontal = false;
        }
      }
      if (isFrontal) {
        this.iFrames = 0.25;
        particles.addDamageText(this.x, this.y, '鋼盾格擋', '#4682b4', true);
        particles.spawnElectricSparks(this.x + Math.cos(this.angle) * 16, this.y + Math.sin(this.angle) * 16, 8);
        AudioManager.playParry();
        InputManager.haptic(25);
        return false;
      }
    }

    // 私酒大亨執照 (Bootlegger): 30% 醉步閃避免傷
    if (GameState.currentRun?.passport === 'bootlegger' && Math.random() < 0.30) {
      particles.addDamageText(this.x, this.y - 20, '🍸 私酒醉步閃避！', '#2ecc71', true);
      this.iFrames = 0.4;
      AudioManager.playDodge();
      return false;
    }

    // 護盾格擋 (v6)
    if (this.hasShield) {
      this.hasShield = false;
      this.iFrames = 0.6;
      particles.addDamageText(this.x, this.y, '護盾格擋', '#00bfff', true);
      AudioManager.playParry();
      InputManager.haptic(30);
      return false;
    }

    // 傷害減免
    let finalAmount = amount * (1.0 - this.damageReduction);
    if (this.ironFortressTimer > 0) finalAmount *= 0.3; // 鋼鐵堡壘 70% 減傷
    if (GameState.currentRun && GameState.currentRun.selectedCocktail === 'godfather') {
      finalAmount *= 1.10; // 教父特調副作用：承傷 +10%
    }

    // 浮士德惡魔契約 (Curse Pacts) 受傷代價
    if (GameState.currentRun?.cursePacts) {
      if (GameState.currentRun.cursePacts.includes('pact_glass')) {
        finalAmount = Math.max(finalAmount, this.hp * 0.35);
      }
      if (GameState.currentRun.cursePacts.includes('pact_midas')) {
        const lost = Math.floor((GameState.currentRun.cash || 0) * 0.15);
        if (lost > 0) {
          GameState.addCash(-lost);
          particles.addDamageText(this.x, this.y - 20, `掉落 -$${lost} 黑金`, '#ffd700', true);
        }
      }
    }

    this.hp -= finalAmount;
    this.iFrames = 0.5;
    if (GameState.currentRun) GameState.currentRun.hp = this.hp;

    AudioManager.playHit();
    InputManager.haptic([40, 60]);
    particles.spawnBlood(this.x, this.y, 10);
    particles.addDamageText(this.x, this.y, '-' + Math.round(finalAmount), '#ff3333');

    // g3 保險箱防衛 (受傷掉 3 枚爆炸金幣手雷)
    if (GameState.currentRun && GameState.currentRun.activeBoons.includes('g3')) {
      for (let i = 0; i < 3; i++) {
        particles.spawnExplosion(this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60);
      }
    }

    // i10 傳奇地獄咆哮 (受傷自動釋放全屏爆震衝擊波)
    if (GameState.currentRun && GameState.currentRun.activeBoons.includes('i10')) {
      particles.spawnExplosion(this.x, this.y);
    }

    // 死亡結算與復活機制 (k5 冰晶護甲 & 安全屋起死回生)
    if (this.hp <= 0) {
      if (!this.hasUsedIceRevive && GameState.currentRun && GameState.currentRun.activeBoons.includes('k5')) {
        this.hasUsedIceRevive = true;
        this.hp = Math.round(this.maxHp * 0.3);
        this.iFrames = 2.0;
        particles.spawnIceCrystals(this.x, this.y, 30);
        particles.addDamageText(this.x, this.y, '冰晶涅槃！', '#00e5ff', true);
        return false;
      }

      if (!this.hasUsedSafehouseRevive && GameState.upgrades.revivalUnlocked) {
        this.hasUsedSafehouseRevive = true;
        this.hp = Math.round(this.maxHp * 0.5);
        this.iFrames = 2.5;
        particles.spawnExplosion(this.x, this.y);
        particles.addDamageText(this.x, this.y, '老教父起死回生！', '#ffd700', true);
        return false;
      }

      return true;
    }

    return false;
  }

  private applyBoonBuffs(enemies: Enemy[]) {
    // 局外夜行身手與軍械精通天賦基礎
    this.speedMult = 1.0 + (GameState.upgrades.speedLevel * 0.05);
    this.damageMult = 1.0;
    this.reloadSpeedMult = 1.0;
    this.heavyChargeSpeedMult = 1.0 + (GameState.upgrades.heavyMasteryLevel * 0.15);
    this.damageReduction = GameState.upgrades.hpLevel * 0.02;

    // 雙槍秒切增傷 Buff (切槍後 2 秒增傷)
    if (this.quickSwapBuffTimer > 0) {
      this.damageMult += (GameState.upgrades.quickSwapLevel * 0.15);
    }

    // 防暴鋼盾重裝負重 (移速 -8%)
    if (this.getCurrentWeapon().id === 9) {
      this.speedMult *= 0.92;
    }

    // 禁酒令調酒吧 Buff
    if (GameState.currentRun && GameState.currentRun.selectedCocktail) {
      const cocktail = GameState.currentRun.selectedCocktail;
      if (cocktail === 'absinthe') {
        this.speedMult += 0.15;
        this.dodgeDuration = 0.38; // 閃避無敵時間 +0.13s
      } else {
        this.dodgeDuration = 0.25;
      }
      if (cocktail === 'godfather') {
        this.damageMult += 0.20; // 全傷害 +20%
      }
    }

    if (GameState.currentRun) {
      for (const b of GameState.currentRun.activeBoons) {
        if (b === 'j1') this.reloadSpeedMult *= 0.5;
        if (b === 'j4') this.damageReduction += 0.2;
        if (b === 'j7') this.heavyChargeSpeedMult *= 1.5;
        if (b === 'c8') this.speedMult += 0.2;
        if (b === 'g1') {
          const bonus = Math.min(0.5, (GameState.currentRun.cash / 100) * 0.05);
          this.damageMult += bonus;
        }
        if (b === 'v10') {
          const shockedCount = enemies.filter(e => e.shockTimer > 0).length;
          this.damageMult += shockedCount * 0.1;
        }
      }

      // j10 傳奇不死泰坦 (生命 < 25% 獲得 50% 減傷)
      if (this.hp < this.maxHp * 0.25 && GameState.currentRun.activeBoons.includes('j10')) {
        this.damageReduction = Math.max(this.damageReduction, 0.5);
      }
    }
  }

  private clampPosition() {
    this.x = Math.max(25, Math.min(515, this.x));
    this.y = Math.max(65, Math.min(895, this.y));
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    const px = this.x + offsetX;
    const py = this.y + offsetY;
    const curW = this.getCurrentWeapon();
    const isMelee = (curW.category === 'melee' || (curW.category === 'heavy' && curW.maxAmmo === 0));

    // 1. 繪製暗影分身 (Shadow Clones)
    for (const cl of this.shadowClones) {
      ctx.save();
      ctx.translate(cl.x + offsetX, cl.y + offsetY);
      ctx.rotate(cl.angle);
      ctx.globalAlpha = cl.alpha * 0.7;
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. 繪製衛星飛刀護盾 (Orbiting Blades)
    if (GameState.currentRun && (GameState.currentRun.activeBoons.includes('k6') || GameState.currentRun.activeBoons.includes('syn5'))) {
      for (let bi = 0; bi < 4; bi++) {
        const ba = this.orbitBladeAngle + (bi * Math.PI / 2);
        const bx = px + Math.cos(ba) * 55;
        const by = py + Math.sin(ba) * 55;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(ba + Math.PI / 2);
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(4, 8);
        ctx.lineTo(0, 5);
        ctx.lineTo(-4, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. 繪製所有自律防衛僚機 (Tactical Drones)
    const droneCount = this.getTotalDroneCount();
    if (droneCount > 0) {
      for (let di = 0; di < droneCount; di++) {
        const da = (Date.now() / 600) + di * (Math.PI * 2 / droneCount);
        const dx = px + Math.cos(da) * 45;
        const dy = py + Math.sin(da) * 45;
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(this.angle);
        // 僚機金屬機身
        ctx.fillStyle = '#102a43';
        ctx.fillRect(-8, -5, 16, 10);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-8, -5, 16, 10);
        // 僚機雙翼
        ctx.fillStyle = '#00bcd4';
        ctx.fillRect(-10, -8, 4, 16);
        // 僚機發光核心與指示燈
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        // 噴射微型等離子尾焰
        ctx.fillStyle = '#80d8ff';
        ctx.fillRect(-12, -2, 4, 4);
        ctx.restore();
      }
    }

    // 腳底動態精力弧光環 (讓玩家視線集中於主角時，清晰感知衝刺翻滾冷卻)
    ctx.save();
    ctx.translate(px, py);

    for (let si = 0; si < this.maxStamina; si++) {
      const segAngle = (Math.PI * 2 / this.maxStamina);
      const startA = si * segAngle + 0.15;
      const endA = (si + 1) * segAngle - 0.15;
      const isReady = si < this.stamina;

      ctx.strokeStyle = isReady ? '#ffd700' : 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = isReady ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 7, startA, endA);
      ctx.stroke();
    }

    // 極限閃避反擊光環 (Perfect Dodge Ready Aura)
    if (this.perfectDodgeBuffTimer > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 護盾光環
    if (this.hasShield) {
      ctx.strokeStyle = '#00bfff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 嗜血/鋼鐵堡壘光環
    if (this.berserkTimer > 0) {
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    if (this.iFrames > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // 風衣主體
    ctx.fillStyle = '#1c1f26';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 軟呢帽
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(2, -8, 12, 16);

    // 實體武器握持造型 (24 種獨立神兵外觀)
    this.renderHeldWeapon(ctx, curW);

    ctx.restore();

    // 近戰專屬特效 (9 大近戰武器完全獨立刀光/衝擊波/刺擊)
    if (this.meleeSwingTimer > 0 && isMelee) {
      this.renderUniqueMeleeVFX(ctx, px, py, curW);
    }

    // 換彈進度條
    if (this.isReloading) {
      ctx.save();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const pct = this.reloadProgress / this.reloadDuration;
      ctx.arc(px, py - 26, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
      ctx.restore();
    }

    // 蓄力金色光環
    if (this.isChargingHeavy) {
      ctx.save();
      const pct = Math.min(1.0, this.chargeTimer / curW.heavyChargeTime);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 渲染握持神兵外觀
  private renderHeldWeapon(ctx: CanvasRenderingContext2D, weapon: WeaponInfo) {
    ctx.fillStyle = weapon.color;

    switch (weapon.id) {
      case 1: // 仕紳手杖劍：修長細劍 + 獅頭金握柄
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(8, 2, 4, 10);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(12, 5, 26, 2.5);
        break;

      case 2: // 工頭破拆鎚：長木柄 + 巨大重型鍛鐵方鎚
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(8, 2, 22, 3);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(26, -4, 14, 15);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.strokeRect(26, -4, 14, 15);
        break;

      case 3: // 改裝雙動左輪：經典銀黑左輪 + 轉輪彈巢
      case 23:
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(8, 4, 14, 4);
        ctx.fillStyle = '#424242';
        ctx.fillRect(10, 2, 5, 8);
        break;

      case 4: // 截短雙管霰彈槍：雙連粗黑槍管 + 原木握把
        ctx.fillStyle = '#37474f';
        ctx.fillRect(8, 3, 18, 6);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(6, 6, 6, 6);
        break;

      case 5: // 黑曜彈簧跳刀：左右手各持一把反手淬毒短刃
        ctx.fillStyle = '#212121';
        ctx.fillRect(10, -8, 14, 3);
        ctx.fillRect(10, 8, 14, 3);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(16, -9, 8, 2);
        ctx.fillRect(16, 9, 8, 2);
        break;

      case 6: // 化學噴火槍：長噴嘴 + 燃料導管 + 點火微光
        ctx.fillStyle = '#d84315';
        ctx.fillRect(6, 2, 22, 6);
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(28, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 7: // 刺刀卡賓步槍：修長步槍管 + 槍頭銀亮軍用刺刀
      case 13:
        ctx.fillStyle = '#455a64';
        ctx.fillRect(8, 4, 28, 3);
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(36, 4);
        ctx.lineTo(44, 5);
        ctx.lineTo(36, 6);
        ctx.fill();
        break;

      case 8: // 雙持短衝鋒
      case 20: // 黑金湯姆森：圓形彈鼓 + 經典金黑槍身
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(8, 3, 16, 5);
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(14, 11, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 9: // 防暴鋼盾警棍：左臂弧形防暴重盾 + 右手電擊棍 (舉盾/衝刺時盾牌橫置架起)
        if (this.isHoldingShield || this.shieldRushTimer > 0 || this.isChargingHeavy) {
          ctx.fillStyle = '#4682b4';
          ctx.fillRect(12, -18, 7, 36);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(12, -18, 7, 36);
          // 能量格擋防護力場
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(14, 0, 24, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#1565c0';
          ctx.fillRect(8, -12, 5, 24);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1;
          ctx.strokeRect(8, -12, 5, 24);
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(12, 6, 14, 3);
        }
        break;

      case 10: // 重型戰術十字弩：橫向弓臂 + 鋼弦與上弦鋼矢
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

      case 11: // 格鬥精鋼指虎：左右雙拳各佩戴四孔尖刺金指虎
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(12, -7, 6, 6);
        ctx.fillRect(12, 5, 6, 6);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(18, -6, 2, 4);
        ctx.fillRect(18, 6, 2, 4);
        break;

      case 12: // 炸藥桶與燃燒瓶：手持點燃火星的紅色炸藥棒
        ctx.fillStyle = '#c62828';
        ctx.fillRect(10, 2, 14, 6);
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(24, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 14: // 荊棘毒藤鋼鞭：盤旋帶刺墨綠鋼鞭
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(16, 5, 7, 0, Math.PI * 1.5);
        ctx.stroke();
        break;

      case 15: // 屠夫砍刀：厚重方型剁肉骨刀
        ctx.fillStyle = '#78909c';
        ctx.fillRect(10, 0, 20, 10);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(10, 8, 20, 2);
        break;

      case 16: // 自律無人機控制器：天線微型控制器
        ctx.fillStyle = '#00bcd4';
        ctx.fillRect(8, 2, 8, 8);
        ctx.strokeStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.lineTo(16, -4);
        ctx.stroke();
        break;

      case 17: // 聲波音叉：巨大雙齒紫色共振音叉
        ctx.fillStyle = '#9c27b0';
        ctx.fillRect(8, 4, 10, 3);
        ctx.fillRect(18, 0, 10, 2.5);
        ctx.fillRect(18, 8, 10, 2.5);
        break;

      case 18: // 冷凍噴槍：冰藍高壓氣瓶
        ctx.fillStyle = '#0288d1';
        ctx.fillRect(6, 2, 20, 7);
        ctx.fillStyle = '#e1f5fe';
        ctx.beginPath();
        ctx.arc(26, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 19: // 加特林：六管旋轉重型槍管
        ctx.fillStyle = '#37474f';
        ctx.fillRect(6, 1, 22, 9);
        ctx.fillStyle = '#263238';
        for (let k = 2; k <= 8; k += 3) {
          ctx.fillRect(24, k, 4, 2);
        }
        break;

      case 21: // 戰術工兵鏟：黑色三角鏟面
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(8, 4, 16, 3);
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(32, 5);
        ctx.lineTo(24, 10);
        ctx.closePath();
        ctx.fill();
        break;

      case 22: // 毒氣榴彈發射器：粗圓榴彈發射管
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(6, 2, 16, 7);
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(22, 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 24: // 死神處刑重鐮：黑鋼彎月鐮刃
        ctx.fillStyle = '#424242';
        ctx.fillRect(8, 4, 22, 3);
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(28, 5, 12, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        break;

      default:
        ctx.fillRect(10, 4, 12, 4);
        break;
    }
  }

  // 渲染 9 大近戰武器完全獨立刀光/打擊特效
  private renderUniqueMeleeVFX(ctx: CanvasRenderingContext2D, px: number, py: number, weapon: WeaponInfo) {
    ctx.save();
    ctx.translate(px, py);

    const progress = 1 - (this.meleeSwingTimer / this.meleeSwingDuration);
    const curAngle = this.meleeSwingAngleStart + (this.meleeSwingAngleEnd - this.meleeSwingAngleStart) * progress;

    switch (weapon.id) {
      case 1: { // 1. 仕紳手杖劍：銀金銳利刺擊弧光
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(curAngle) * this.meleeBladeLength, Math.sin(curAngle) * this.meleeBladeLength);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, curAngle - 0.2, curAngle + 0.2);
        ctx.stroke();
        break;
      }
      case 2: { // 2. 工頭破拆鎚：地面震裂與金色碎石狂瀾
        ctx.strokeStyle = '#a37c48';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, this.angle - 0.4, this.angle + 0.4);
        ctx.stroke();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, this.angle - 0.5, this.angle + 0.5);
        ctx.fill();
        break;
      }
      case 5: { // 5. 黑曜跳刀：雙道鮮紅十字斬交錯線 (X-Slash)
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(this.angle - 0.6) * 15, Math.sin(this.angle - 0.6) * 15);
        ctx.lineTo(Math.cos(this.angle + 0.4) * 60, Math.sin(this.angle + 0.4) * 60);
        ctx.moveTo(Math.cos(this.angle + 0.6) * 15, Math.sin(this.angle + 0.6) * 15);
        ctx.lineTo(Math.cos(this.angle - 0.4) * 60, Math.sin(this.angle - 0.4) * 60);
        ctx.stroke();
        break;
      }
      case 9: { // 9. 防暴鋼盾警棍：藍色電磁弧盾
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, this.angle - 0.8, this.angle + 0.8);
        ctx.stroke();
        break;
      }
      case 11: { // 11. 精鋼指虎：金色拳風衝擊波環
        ctx.strokeStyle = '#ff9100';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(Math.cos(this.angle) * 35, Math.sin(this.angle) * 35, 18 * progress + 6, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 14: { // 14. 荊棘鋼鞭：綠色蛇形長鞭波動
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let i = 0.2; i <= 1.0; i += 0.2) {
          const wave = Math.sin(i * 8 + progress * 6) * 15;
          const wx = Math.cos(this.angle) * (this.meleeBladeLength * i) - Math.sin(this.angle) * wave;
          const wy = Math.sin(this.angle) * (this.meleeBladeLength * i) + Math.cos(this.angle) * wave;
          ctx.lineTo(wx, wy);
        }
        ctx.stroke();
        break;
      }
      case 15: { // 15. 屠夫砍刀：血霧沉重劈砸弧
        ctx.fillStyle = 'rgba(183, 28, 28, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.meleeBladeLength, this.meleeSwingAngleStart, curAngle, this.meleeSwingAngleStart > this.meleeSwingAngleEnd);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, curAngle - 0.4, curAngle + 0.4);
        ctx.stroke();
        break;
      }
      case 21: { // 21. 工兵鏟：泥土碎石破土弧
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, this.angle - 0.5, this.angle + 0.5);
        ctx.stroke();
        break;
      }
      case 24: { // 24. 死神重鐮：暗紅巨型彎月靈魂收割
        ctx.fillStyle = 'rgba(136, 14, 79, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.meleeBladeLength, this.meleeSwingAngleStart, curAngle, this.meleeSwingAngleStart > this.meleeSwingAngleEnd);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, curAngle - 0.5, curAngle + 0.5);
        ctx.stroke();
        break;
      }
      default: {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.meleeBladeLength, curAngle - 0.3, curAngle + 0.3);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

}

