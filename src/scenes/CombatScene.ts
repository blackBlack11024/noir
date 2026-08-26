import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Obstacle, ObstacleType } from '../entities/Obstacle';
import { ProjectileManager } from '../entities/Projectile';
import { ParticleSystem } from '../entities/ParticleSystem';
import { Camera } from '../core/Camera';
import { HUD } from '../ui/HUD';
import { BoonModal } from '../ui/BoonModal';
import { PauseModal } from '../ui/PauseModal';
import { MerchantModal } from '../ui/MerchantModal';
import { TouchControls } from '../ui/TouchControls';
import { AltarModal } from '../ui/AltarModal';
import { GunsmithModal } from '../ui/GunsmithModal';
import { GameState, RunSummary } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { WEAPON_DATABASE } from '../data/WeaponDatabase';

interface SpawnWarning {
  x: number;
  y: number;
  timer: number;
  eid: number;
  isElite: boolean;
}

export interface RoomGate {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'merchant' | 'challenge' | 'shrine' | 'gunsmith' | 'normal';
  label: string;
  icon: string;
  desc: string;
  color: string;
}

export class CombatScene {
  public player: Player;
  public enemies: Enemy[] = [];
  public boss: Boss | null = null;
  public obstacles: Obstacle[] = [];
  public projectiles: ProjectileManager;
  public particles: ParticleSystem;
  public camera: Camera;
  public hud: HUD;
  public boonModal: BoonModal;
  public pauseModal: PauseModal;
  public merchantModal: MerchantModal;
  public altarModal: AltarModal;
  public gunsmithModal: GunsmithModal;
  public touchControls: TouchControls;

  public isRoomCleared: boolean = false;
  public hasRecordedBossDefeat: boolean = false;
  public unlockBannerText: string | null = null;
  public unlockBannerTimer: number = 0;

  // Boss 登場黑色電影演出與輪迴橫幅
  public bossIntroTimer: number = 0;
  public loopBannerText: string | null = null;
  public loopBannerTimer: number = 0;

  // 果汁感與連擊狂熱評價系統 (Game Juice & Style Meter)
  public hitstopTimer: number = 0;
  public styleScore: number = 0;
  public styleRank: 'D' | 'C' | 'B' | 'A' | 'S' | 'SSS' = 'D';
  public comboCount: number = 0;
  public comboTimer: number = 0;
  public roomClearBannerTimer: number = 0;

  // 戰術分支傳送門 (Room Branching Gates)
  public roomGates: RoomGate[] = [];

  // 黑色電影動態視野迷霧與煙霧遮罩畫布
  private lightingCanvas: HTMLCanvasElement;
  private lightingCtx: CanvasRenderingContext2D | null;

  // 波次與出生預警
  public currentWave: number = 1;
  public totalWaves: number = 2;
  public spawnWarnings: SpawnWarning[] = [];

  constructor() {
    this.player = new Player();
    this.projectiles = new ProjectileManager();
    this.particles = new ParticleSystem();
    this.camera = new Camera();
    this.hud = new HUD();
    this.boonModal = new BoonModal();
    this.pauseModal = new PauseModal();
    this.merchantModal = new MerchantModal();
    this.altarModal = new AltarModal();
    this.gunsmithModal = new GunsmithModal();
    this.touchControls = new TouchControls();

    this.lightingCanvas = document.createElement('canvas');
    this.lightingCanvas.width = 540;
    this.lightingCanvas.height = 960;
    this.lightingCtx = this.lightingCanvas.getContext('2d');
  }

  public initRoom() {
    this.projectiles.list = [];
    this.particles.particles = [];
    this.particles.damageNumbers = [];
    this.isRoomCleared = false;
    this.hasRecordedBossDefeat = false;
    this.unlockBannerText = null;
    this.unlockBannerTimer = 0;
    this.spawnWarnings = [];
    this.currentWave = 1;
    this.bossIntroTimer = 0;

    const run = GameState.currentRun;
    if (!run) return;

    const isNewRun = (run.roomsCleared === 0 && run.roomIndex === 1 && run.zone === 1);
    if (isNewRun) {
      this.player.resetForNewRun();
    } else {
      this.player.resetForNewRoom();
    }

    // 固定每關開局出生點 (戰場下方入口中央 270, 820，面朝上方)
    this.player.x = 270;
    this.player.y = 820;
    this.player.angle = -Math.PI / 2;
    this.player.isDodging = false;
    this.player.isReloading = false;
    this.player.chargeTimer = 0;
    this.player.isChargingHeavy = false;
    this.player.meleeSwingTimer = 0;
    this.player.stamina = this.player.maxStamina;
    this.camera.x = 0;
    this.camera.y = 340;
    this.camera.targetX = 0;
    this.camera.targetY = 340;

    // 生成地圖掩體障礙物
    this.generateObstacles(run.roomIndex === 4, run.roomIndex, run.zone);

    // 第 4 間房為 BOSS 戰
    if (run.roomIndex === 4) {
      AudioManager.setMood('boss');
      const baseBoss = (run.zone - 1) * 4;
      const bossOffset = Math.floor(Math.random() * 4);
      const bossId = Math.min(24, Math.max(1, baseBoss + bossOffset + 1));
      
      const loop = run.loopCount || 1;
      const tier = Math.min(4, Math.max(1, run.zone + (loop - 1))) as 1 | 2 | 3 | 4;
      this.boss = new Boss(bossId, tier, loop);
      this.bossIntroTimer = 3.2; // 3.2 秒黑色電影大字橫幅與金句定格
      this.enemies = [];
      this.totalWaves = 1;
    } else {
      AudioManager.setMood('combat');
      this.boss = null;
      // 階梯式波次架構：第 1 房 3 波、第 2 房 3 波、第 3 房 4 波，每輪輪迴 +1 波 (最高 5 波)
      const baseWaves = run.roomIndex === 3 ? 4 : 3;
      this.totalWaves = Math.min(5, baseWaves + (run.loopCount - 1));
      this.queueWaveSpawns(1);
    }
  }

  // 8 大戰術地圖原型 (巷子、雙大柱、四柱迷宮、分流通道、密室、下水道、金庫、歌劇大廳)
  private generateObstacles(isBossRoom: boolean, roomIndex: number, zone: number) {
    this.obstacles = [];
    const layoutType = isBossRoom ? (zone % 3 === 0 ? 7 : (zone % 2 === 0 ? 1 : 2)) : ((roomIndex + zone) % 8);

    switch (layoutType) {
      case 0: // 1. 狹窄暗巷 (Narrow Alleyway)
        // 兩側路障夾殺，中間留有垂直狹窄通道與 TNT 陷阱
        for (let y = 220; y <= 680; y += 110) {
          this.obstacles.push(new Obstacle('sandbag', 80, y, 22));
          this.obstacles.push(new Obstacle('sandbag', 460, y, 22));
        }
        this.obstacles.push(new Obstacle('explosive_barrel', 270, 360, 18));
        this.obstacles.push(new Obstacle('explosive_barrel', 270, 560, 18));
        break;

      case 1: // 2. 中央雙雄巨柱 (Twin Central Pillars)
        // 兩根巨大承重鋼柱，適合繞柱甩槍與風箏
        this.obstacles.push(new Obstacle('pillar', 170, 450, 32));
        this.obstacles.push(new Obstacle('pillar', 370, 450, 32));
        this.obstacles.push(new Obstacle('explosive_barrel', 270, 450, 18));
        this.obstacles.push(new Obstacle('barrel', 170, 280, 18));
        this.obstacles.push(new Obstacle('barrel', 370, 280, 18));
        this.obstacles.push(new Obstacle('sandbag', 270, 620, 20));
        break;

      case 2: // 3. 四柱迷宮貨倉 (4-Pillar Cross Maze)
        this.obstacles.push(new Obstacle('pillar', 160, 320, 26));
        this.obstacles.push(new Obstacle('pillar', 380, 320, 26));
        this.obstacles.push(new Obstacle('pillar', 160, 580, 26));
        this.obstacles.push(new Obstacle('pillar', 380, 580, 26));
        this.obstacles.push(new Obstacle('explosive_barrel', 270, 450, 18));
        this.obstacles.push(new Obstacle('barrel', 160, 450, 18));
        this.obstacles.push(new Obstacle('barrel', 380, 450, 18));
        break;

      case 3: // 4. 分流雙通道庫房 (Split Central Corridor)
        // 中央縱向隔斷牆，迫使走左右兩翼包夾
        this.obstacles.push(new Obstacle('sandbag', 270, 260, 22));
        this.obstacles.push(new Obstacle('pillar', 270, 380, 28));
        this.obstacles.push(new Obstacle('explosive_barrel', 270, 500, 18));
        this.obstacles.push(new Obstacle('pillar', 270, 620, 28));
        this.obstacles.push(new Obstacle('barrel', 110, 440, 18));
        this.obstacles.push(new Obstacle('barrel', 430, 440, 18));
        break;

      case 4: // 5. 壓迫私酒密室 (Cramped Backroom)
        // 四角堆滿私酒桶與炸藥，中央戰鬥空間狹小緊張
        this.obstacles.push(new Obstacle('barrel', 110, 220, 20));
        this.obstacles.push(new Obstacle('explosive_barrel', 150, 220, 18));
        this.obstacles.push(new Obstacle('barrel', 430, 220, 20));
        this.obstacles.push(new Obstacle('explosive_barrel', 390, 220, 18));
        this.obstacles.push(new Obstacle('sandbag', 100, 640, 22));
        this.obstacles.push(new Obstacle('sandbag', 440, 640, 22));
        this.obstacles.push(new Obstacle('barrel', 270, 440, 18));
        break;

      case 5: // 6. 地下排水渠水道 (Sewer Canal)
        this.obstacles.push(new Obstacle('statue', 140, 340, 26));
        this.obstacles.push(new Obstacle('statue', 400, 340, 26));
        this.obstacles.push(new Obstacle('sandbag', 140, 540, 22));
        this.obstacles.push(new Obstacle('sandbag', 400, 540, 22));
        this.obstacles.push(new Obstacle('explosive_barrel', 270, 440, 18));
        break;

      case 6: // 7. 黑幫地下金庫 (Bank Vault)
        this.obstacles.push(new Obstacle('pillar', 160, 300, 30));
        this.obstacles.push(new Obstacle('pillar', 380, 300, 30));
        this.obstacles.push(new Obstacle('statue', 270, 480, 28));
        this.obstacles.push(new Obstacle('explosive_barrel', 140, 600, 18));
        this.obstacles.push(new Obstacle('explosive_barrel', 400, 600, 18));
        break;

      case 7: // 8. 豪門歌劇大舞廳 (Grand Ballroom)
        // 宏偉環形柱列，開闊的交鋒視野
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const cx = 270 + Math.cos(a) * 160;
          const cy = 460 + Math.sin(a) * 160;
          this.obstacles.push(new Obstacle(i % 2 === 0 ? 'pillar' : 'statue', cx, cy, 24));
        }
        this.obstacles.push(new Obstacle('explosive_barrel', 270, 460, 18));
        break;
    }
  }

  // 根據區域派系映射小怪 ID
  private getZoneEnemyIds(zone: number): number[] {
    switch (zone) {
      case 1: return [1, 2, 3, 4, 5];       // 街頭混混幫
      case 2: return [6, 7, 8, 9, 10];     // 碼頭走私幫
      case 3: return [11, 12, 13, 14, 15]; // 私酒地下工廠
      case 4: return [16, 17, 18, 19, 20]; // 暗夜秘密賭場
      case 5: return [21, 22, 23, 24, 25]; // 腐敗憲兵防暴隊
      case 6: return [26, 27, 28, 29, 30, 31, 32]; // 墓穴與市政廳禁衛
      default: return [1, 2, 3, 4, 5];
    }

  }

  private queueWaveSpawns(waveNum: number) {
    const run = GameState.currentRun;
    const zone = run ? run.zone : 1;
    const loop = run ? (run.loopCount || 1) : 1;
    const validIds = this.getZoneEnemyIds(zone);

    // 大幅擴增每波次敵人群體規模：第 1 波 6~8 隻、第 2 波 9~12 隻、第 3 波 13~16 隻、決戰波 16~20 隻
    const baseCount = 5 + waveNum * 3 + Math.floor(zone * 1.2) + (loop - 1) * 3;
    const count = Math.min(22, baseCount);

    // 菁英敵人出現率隨波次逐步攀升 (第 1 波 0%, 第 2 波 18%, 第 3 波 38%, 決戰波 65%)
    let eliteChance = 0;
    if (waveNum === 2) eliteChance = 0.18 + (loop - 1) * 0.1;
    else if (waveNum === 3) eliteChance = 0.38 + (loop - 1) * 0.15;
    else if (waveNum >= 4) eliteChance = 0.65 + (loop - 1) * 0.2;

    if (waveNum >= 2) {
      AudioManager.playShot('shotgun');
      this.camera.shake(3.5, 0.15);
      this.particles.addDamageText(270, 200, waveNum === this.totalWaves ? '黑道精銳決戰總攻！' : '黑幫增援第 ' + waveNum + ' 波！', '#ff3333', true);
    }

    for (let i = 0; i < count; i++) {
      const eid = validIds[Math.floor(Math.random() * validIds.length)];
      // 分散在戰場上半部與兩側進行戰術包夾
      const ex = 45 + Math.random() * 450;
      const ey = 100 + Math.random() * 580;
      const isElite = Math.random() < eliteChance;

      this.spawnWarnings.push({
        x: ex,
        y: ey,
        timer: Math.max(0.35, 0.65 - (waveNum * 0.05) - (loop - 1) * 0.05),
        eid,
        isElite
      });
    }
  }

  public update(dt: number): 'next_room' | 'summary' | null {
    // 檢查暫停快捷鍵 (Esc / P) 或點擊頂部右上角暫停
    if (InputManager.isKeyJustPressed('Escape') || InputManager.isKeyJustPressed('KeyP')) {
      if (this.pauseModal.isOpen) {
        this.pauseModal.close();
      } else if (!this.boonModal.isOpen) {
        this.pauseModal.open();
      }
    }

    if (InputManager.isLmbJustPressed && !this.boonModal.isOpen && !this.pauseModal.isOpen) {
      const mx = InputManager.mouseX;
      const my = InputManager.mouseY;
      // 點擊頂部右上角暫停熱區 (x: 440~535, y: 4~36)
      if (mx >= 440 && mx <= 535 && my >= 4 && my <= 36) {
        this.pauseModal.open();
        return null;
      }
      // 手機端點擊左上角武器欄快速切換主副手 (x: 8~220, y: 8~70)
      if (InputManager.isTouchDevice && mx >= 8 && mx <= 220 && my >= 8 && my <= 70) {
        this.player.swapWeapon();
      }
    }

    // 暫停模態視窗更新
    if (this.pauseModal.isOpen) {
      const pNext = this.pauseModal.update();
      if (pNext === 'retire') {
        GameState.endRun(false);
        return 'summary';
      }
      return null;
    }

    // 黑市商人模態視窗更新
    if (this.merchantModal.isOpen) {
      const pNext = this.merchantModal.update(this.player);
      if (pNext) {
        return this.advanceRoom();
      }
      return null;
    }

    // 浮士德血祭神龕更新
    if (this.altarModal.isOpen) {
      const pNext = this.altarModal.update(this.player);
      if (pNext) {
        return this.advanceRoom();
      }
      return null;
    }

    // 軍火黑市改裝台更新
    if (this.gunsmithModal.isOpen) {
      const pNext = this.gunsmithModal.update(this.player);
      if (pNext) {
        return this.advanceRoom();
      }
      return null;
    }

    // 命中頓幀 (Hitstop)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return null;
    }

    // 連擊計時衰減與 Style Meter 結算
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    } else {
      this.styleScore = Math.max(0, this.styleScore - 40 * dt);
    }

    if (this.styleScore >= 1300) this.styleRank = 'SSS';
    else if (this.styleScore >= 850) this.styleRank = 'S';
    else if (this.styleScore >= 500) this.styleRank = 'A';
    else if (this.styleScore >= 250) this.styleRank = 'B';
    else if (this.styleScore >= 100) this.styleRank = 'C';
    else this.styleRank = 'D';

    this.camera.targetX = this.player.x - 270;
    this.camera.targetY = this.player.y - 480;
    this.camera.update(dt);

    if (this.unlockBannerTimer > 0) this.unlockBannerTimer -= dt;
    if (this.bossIntroTimer > 0) this.bossIntroTimer -= dt;
    if (this.loopBannerTimer > 0) this.loopBannerTimer -= dt;
    if (this.roomClearBannerTimer > 0) this.roomClearBannerTimer -= dt;

    // 天賦彈窗
    if (this.boonModal.isOpen) {
      const chosen = this.boonModal.update();
      if (chosen) {
        // 選完天賦後若已清房且有分支門，則讓玩家走入傳送門
        if (this.roomGates.length === 0) {
          return this.advanceRoom();
        }
      }
      return null;
    }

    // 檢查玩家踏入戰術分支傳送門
    if (this.isRoomCleared && this.roomGates.length > 0 && !this.boonModal.isOpen && !this.merchantModal.isOpen && !this.altarModal.isOpen && !this.gunsmithModal.isOpen) {
      for (let i = 0; i < this.roomGates.length; i++) {
        const gate = this.roomGates[i];
        const gdx = this.player.x - gate.x;
        const gdy = this.player.y - gate.y;
        if (Math.abs(gdx) < gate.width / 2 + 15 && Math.abs(gdy) < gate.height / 2 + 15) {
          if (gate.type === 'merchant') {
            this.merchantModal.open();
            this.roomGates = [];
            return null;
          } else if (gate.type === 'shrine') {
            this.altarModal.open();
            this.roomGates = [];
            return null;
          } else if (gate.type === 'gunsmith') {
            this.gunsmithModal.open();
            this.roomGates = [];
            return null;
          } else {
            this.roomGates = [];
            return this.advanceRoom();
          }
        }
      }
    }

    // 處理小怪出生預警
    const loop = GameState.currentRun ? (GameState.currentRun.loopCount || 1) : 1;
    for (let i = this.spawnWarnings.length - 1; i >= 0; i--) {
      const w = this.spawnWarnings[i];
      w.timer -= dt;
      if (w.timer <= 0) {
        const enemy = new Enemy(w.eid, w.x, w.y, w.isElite, loop);
        
        // k9 傳奇萬物冰封 (進入房間前 5 秒敵人移速攻速 -50%)
        if (GameState.currentRun && GameState.currentRun.activeBoons.includes('k9')) {
          enemy.freezeTimer = 5.0;
        }

        this.enemies.push(enemy);
        this.particles.spawnSmoke(w.x, w.y, 4, 'rgba(120, 20, 20, 0.4)', 22, 0.6);
        this.spawnWarnings.splice(i, 1);
      }
    }

    this.particles.update(dt);
    this.projectiles.update(dt, this.player.x, this.player.y, this.enemies, this.boss);

    // 金幣黑洞磁力吸附
    if (this.isRoomCleared) {
      for (const p of this.particles.particles) {
        const pdx = this.player.x - p.x;
        const pdy = this.player.y - p.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist > 5) {
          p.vx += (pdx / pdist) * 950 * dt;
          p.vy += (pdy / pdist) * 950 * dt;
        }
      }
    }

    // 戰術煙霧隱蔽判定：若主角身處煙霧雲團中，獲得潛行隱身與背刺暴擊優勢
    let inSmoke = false;
    for (const s of this.particles.smokeClouds) {
      const sdx = this.player.x - s.x;
      const sdy = this.player.y - s.y;
      if (Math.sqrt(sdx * sdx + sdy * sdy) < s.radius) {
        inSmoke = true;
        break;
      }
    }
    if (inSmoke) {
      this.player.stealthTimer = Math.max(this.player.stealthTimer, 0.25);
    }

    // 玩家更新
    this.player.update(dt, this.enemies, this.boss, this.projectiles, this.particles);
    if (this.player.hp <= 0) {
      AudioManager.playExplosion();
      GameState.endRun(false);
      return 'summary';
    }

    // 判斷時空慢動作子彈時間 (Bullet Time)
    const enemyDt = this.player.bulletTimeTimer > 0 ? dt * 0.35 : dt;

    // 小怪更新
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(enemyDt, this.player, this.projectiles, this.particles);
      if (e.isDead) {
        const baseCash = e.isElite ? 45 : 15;
        const cashMult = (GameState.currentRun && GameState.currentRun.activeBoons.includes('g2')) ? 2 : 1;
        const styleCashBonus = this.styleRank === 'SSS' ? 1.3 : 1.0;
        GameState.addCash(Math.round(baseCash * cashMult * styleCashBonus));
        if (GameState.currentRun) GameState.currentRun.kills++;
        this.onEnemyKilled(e);
        this.enemies.splice(i, 1);
      }
    }

    // Boss 更新與小弟召喚處理
    if (this.boss) {
      if (!this.boss.isDead) {
        this.boss.update(enemyDt, this.player, this.projectiles, this.particles);

        // Boss 呼叫援軍招式執行
        if (this.boss.pendingMinionSpawns > 0) {
          const run = GameState.currentRun;
          const zone = run ? run.zone : 1;
          const validIds = this.getZoneEnemyIds(zone);
          for (let k = 0; k < this.boss.pendingMinionSpawns; k++) {
            const eid = validIds[Math.floor(Math.random() * validIds.length)];
            const ang = Math.random() * Math.PI * 2;
            const sx = Math.max(50, Math.min(490, this.boss.x + Math.cos(ang) * 90));
            const sy = Math.max(120, Math.min(800, this.boss.y + Math.sin(ang) * 90));
            this.spawnWarnings.push({
              x: sx,
              y: sy,
              timer: 0.5,
              eid,
              isElite: false
            });
          }
          this.boss.pendingMinionSpawns = 0;
        }
      }

      if (this.boss.isDead && !this.hasRecordedBossDefeat) {
        this.handleBossDeath();
      }
    }

    // 子彈、地面危害、掩體與實體碰撞
    this.handleCollisions(dt);

    // 實體與掩體物理推擠阻擋 (Soft push)
    this.handleObstacleCollisions();

    // 檢查波次或房間清空
    if (!this.boss && this.enemies.length === 0 && this.spawnWarnings.length === 0) {
      if (this.currentWave < this.totalWaves) {
        this.currentWave++;
        this.queueWaveSpawns(this.currentWave);
      } else if (!this.isRoomCleared) {
        this.clearRoom();
      }
    } else if (this.boss && this.boss.isDead && !this.isRoomCleared) {
      this.clearRoom();
    }

    return null;
  }

  private handleObstacleCollisions() {
    for (const obs of this.obstacles) {
      if (obs.isDead) continue;

      // 1. 玩家與掩體阻擋
      const pdx = this.player.x - obs.x;
      const pdy = this.player.y - obs.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
      const minPdist = this.player.radius + obs.radius;
      if (pdist < minPdist && pdist > 0.001) {
        this.player.x = obs.x + (pdx / pdist) * minPdist;
        this.player.y = obs.y + (pdy / pdist) * minPdist;
      }

      // 2. 小怪與掩體阻擋
      for (const e of this.enemies) {
        if (e.isDead) continue;
        const edx = e.x - obs.x;
        const edy = e.y - obs.y;
        const edist = Math.sqrt(edx * edx + edy * edy);
        const minEdist = e.radius + obs.radius;
        if (edist < minEdist && edist > 0.001) {
          e.x = obs.x + (edx / edist) * minEdist;
          e.y = obs.y + (edy / edist) * minEdist;

          // 撞上障礙物觸發撞牆碎骨傷害 (Obstacle Wall Splat)
          if (e.wallSplatPendingDmg > 0 && Math.hypot(e.knockbackVx, e.knockbackVy) > 30) {
            const splatDmg = e.wallSplatPendingDmg;
            e.wallSplatPendingDmg = 0;
            e.knockbackVx = 0;
            e.knockbackVy = 0;
            e.takeDamage(splatDmg, this.particles, 'shock', true);
            e.staggerTimer = 1.0;
            e.state = 'stagger';
            AudioManager.playHit();
            this.particles.spawnSmoke(e.x, e.y, 8, '#ffd700');
            this.particles.spawnElectricSparks(e.x, e.y, 10);
            this.particles.addDamageText(e.x, e.y, '撞牆碎骨！', '#ff5722', true);
            obs.takeDamage(splatDmg * 0.5, this.particles, this.projectiles, this.player);
          }
        }
      }
    }
  }

  private handleBossDeath() {
    if (!this.boss || this.hasRecordedBossDefeat) return;
    this.hasRecordedBossDefeat = true;

    const weaponId = this.boss.info.weaponRewardId || this.boss.info.id;
    const isFirst = GameState.recordBossDefeat(this.boss.info.id, weaponId);
    const wInfo = WEAPON_DATABASE[weaponId];
    if (wInfo) {
      this.unlockBannerText = (isFirst ? '首次擊敗頭目 解鎖神兵: ' : '擊敗頭目: ') + wInfo.name;
      this.unlockBannerTimer = 4.5;
    }
    const loop = GameState.currentRun ? (GameState.currentRun.loopCount || 1) : 1;
    const bossCash = 350 * loop;
    GameState.addCash(bossCash);
    if (GameState.currentRun) GameState.currentRun.kills++;
    AudioManager.playBoonCard();
  }

  private clearRoom() {
    if (this.boss && this.boss.isDead && !this.hasRecordedBossDefeat) {
      this.handleBossDeath();
    }

    this.isRoomCleared = true;
    this.roomClearBannerTimer = 3.0;
    AudioManager.playCash();
    this.camera.shake(8, 0.4);

    const run = GameState.currentRun;
    if (run) {
      run.roomsCleared++;
      // g8 貪婪利息 (通關結算 5% 利息)
      if (run.activeBoons.includes('g8')) {
        const interest = Math.floor(run.cash * 0.05);
        if (interest > 0) {
          GameState.addCash(interest);
          this.particles.addDamageText(this.player.x, this.player.y, '利息 +$' + interest, '#2ecc71', true);
        }
      }

      // 通關立即觸發隨機 3 選 1 抽卡結算 (包含神賜天賦/升階、武器改裝、血祭契約、黑市軍備補給)
      const isBoss = (run.roomIndex === 4);
      this.boonModal.open(isBoss, isBoss ? '👑 擊敗頭目·傳奇教父黑道神賜' : '🎲 通關結算·命運三選一');
      this.roomGates = [];
    }
  }

  private onEnemyKilled(e: Enemy) {
    if (!GameState.currentRun) return;

    this.comboCount++;
    this.comboTimer = 2.8;
    this.styleScore += e.isElite ? 60 : 25;
    this.hitstopTimer = 0.04;

    // j9 傳奇不可阻擋 (擊殺自動補滿彈匣)
    if (GameState.currentRun.activeBoons.includes('j9')) {
      const weapon = this.player.getCurrentWeapon();
      if (weapon.maxAmmo > 0) {
        this.player.setAmmo(weapon.maxAmmo);
      }
      this.player.stamina = this.player.maxStamina;
      this.particles.addDamageText(this.player.x, this.player.y, '彈藥補滿', '#ffd700');
    }

    // c6 殺戮盛宴 (擊殺回血)
    if (GameState.currentRun.activeBoons.includes('c6')) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 3);
      this.particles.addDamageText(this.player.x, this.player.y, '+3 HP', '#2ecc71');
    }

    // c9 傳奇血染巴黎 (擊殺引爆全場所有敵人的流血層數)
    if (GameState.currentRun.activeBoons.includes('c9')) {
      for (const other of this.enemies) {
        if (!other.isDead && other.bleedTimer > 0) {
          other.takeDamage(70, this.particles, undefined, true);
          this.particles.spawnExplosion(other.x, other.y);
        }
      }
    }

    // g9 傳奇點石成金 (擊殺化身純金雕像爆碎出 10 枚穿透金幣破片)
    if (GameState.currentRun.activeBoons.includes('g9')) {
      GameState.addCash(15);
      this.particles.addDamageText(e.x, e.y, '+15 黑金', '#ffd700', true);
      this.particles.spawnElectricSparks(e.x, e.y, 16);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        this.projectiles.spawnBullet(e.x, e.y, a, 520, 32, true, '#ffd700', true, 1);
      }
    }
  }

  private handleCollisions(dt: number) {
    for (let i = this.projectiles.list.length - 1; i >= 0; i--) {
      const p = this.projectiles.list[i];

      // 1. 地面範圍危害 (火海 / 毒霧 / 冰面) 節流閥結算 (每 0.35s 結算一次)
      if (p.isAreaHazard) {
        p.tickTimer = (p.tickTimer ?? 0) - dt;
        if (p.tickTimer <= 0) {
          p.tickTimer = p.tickInterval || 0.35;
          const tickDmg = p.damage * 0.35;

          // 命中玩家 (僅限敵方危險沼澤，玩家自製火海/毒霧 100% 免除自傷)
          if (!p.isPlayer) {
            const pdx = this.player.x - p.x;
            const pdy = this.player.y - p.y;
            if (Math.sqrt(pdx * pdx + pdy * pdy) < this.player.radius + p.radius) {
              this.player.takeDamage(tickDmg * 0.75, this.particles, p.x, p.y);
            }
          }

          // 命中周圍小怪
          for (const e of this.enemies) {
            if (e.isDead) continue;
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < e.radius + p.radius) {
              const actual = e.takeDamage(tickDmg, this.particles, p.statusEffect, false);
              if (GameState.currentRun) GameState.currentRun.damageDealt += actual;
            }
          }

          // 命中周圍 Boss
          if (this.boss && !this.boss.isDead) {
            const dx = this.boss.x - p.x;
            const dy = this.boss.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.boss.radius + p.radius) {
              this.boss.takeDamage(tickDmg, this.particles);
              if (GameState.currentRun) GameState.currentRun.damageDealt += tickDmg;
            }
          }

          // 命中周圍掩體 (引發連鎖引爆)
          for (const obs of this.obstacles) {
            if (obs.isDead) continue;
            const dx = obs.x - p.x;
            const dy = obs.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < obs.radius + p.radius) {
              obs.takeDamage(tickDmg, this.particles, this.projectiles, this.player);
            }
          }
        }
        continue;
      }

      // 2. 子彈擊中地圖掩體
      let hitObstacle = false;
      for (const obs of this.obstacles) {
        if (obs.isDead) continue;
        const dx = obs.x - p.x;
        const dy = obs.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < obs.radius + p.radius) {
          obs.takeDamage(p.damage, this.particles, this.projectiles, this.player);
          p.pierce--;
          hitObstacle = true;

          // 炸藥桶/爆裂彈撞牆觸發範圍劇烈爆炸
          if (p.isExplosive || p.visualType === 'dynamite') {
            this.particles.spawnExplosion(p.x, p.y);
            this.camera.shake(6.5, 0.16);
            AudioManager.playExplosion();
            const blast = p.blastRadius || 120;
            for (const e of this.enemies) {
              if (e.isDead) continue;
              if (Math.hypot(e.x - p.x, e.y - p.y) <= blast) {
                e.takeDamage(p.damage * 0.85, this.particles, 'burn', true);
              }
            }
            if (this.boss && !this.boss.isDead && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) <= blast) {
              this.boss.takeDamage(p.damage * 0.85, this.particles);
            }
            if (p.spawnFireHazard) {
              this.projectiles.spawnHazardArea(p.x, p.y, blast * 0.65, 3.5, 45, 'rgba(255, 69, 0, 0.6)', 'burn', p.isPlayer);
            }
          }

          if (p.pierce <= 0) {
            this.projectiles.list.splice(i, 1);
            break;
          }
        }
      }
      if (hitObstacle && p.pierce <= 0) continue;

      // 3. 實體子彈傷害結算 (嚴格分離玩家彈幕與敵方彈幕)
      if (p.isPlayer) {
        // 玩家子彈擊中小怪
        for (const e of this.enemies) {
          if (e.isDead) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < e.radius + p.radius) {
            const actualDmg = e.takeDamage(p.damage, this.particles, p.statusEffect, p.isHeavy);
            if (GameState.currentRun) GameState.currentRun.damageDealt += actualDmg;

            if (p.isHeavy) {
              this.hitstopTimer = 0.045;
              this.camera.shake(5.0, 0.12);
            } else {
              this.camera.shake(1.8, 0.06);
            }

            // 陷阱/地雷定身並同步向觸發方向發射穿牆重型弩彈
            if (p.isTrap) {
              e.staggerTimer = 2.5;
              e.state = 'stagger';
              AudioManager.playShot('revolver');
              this.particles.spawnElectricSparks(p.x, p.y, 16);

              // 地雷引爆時同步朝觸發方向連射 3 發穿牆貫穿弩矢 (Wall-Piercing Crossbow Bolts)
              const trigAngle = Math.atan2(e.y - p.y, e.x - p.x);
              for (let bi = -1; bi <= 1; bi++) {
                const boltAngle = trigAngle + bi * 0.22;
                this.projectiles.spawnBullet(p.x, p.y, boltAngle, 800, p.damage * 1.5, true, '#d4af37', true, 999, 'bleed', 'crossbow_bolt');
              }
              this.particles.spawnMuzzleFlash(p.x, p.y, trigAngle, '#ffd700');
            }

            // 炸藥桶/爆裂彈引發範圍大爆炸 (AOE Explosion)
            if (p.isExplosive || p.visualType === 'dynamite') {
              this.particles.spawnExplosion(p.x, p.y);
              this.particles.spawnElectricSparks(p.x, p.y, 20);
              this.camera.shake(7.5, 0.2);
              AudioManager.playExplosion();
              const blast = p.blastRadius || 125;

              // 範圍濺射傷害全場周圍敵人與 BOSS
              for (const other of this.enemies) {
                if (other !== e && !other.isDead && Math.hypot(other.x - p.x, other.y - p.y) <= blast) {
                  const splashDmg = other.takeDamage(p.damage * 0.9, this.particles, 'burn', true);
                  if (GameState.currentRun) GameState.currentRun.damageDealt += splashDmg;
                }
              }
              if (this.boss && !this.boss.isDead && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) <= blast) {
                this.boss.takeDamage(p.damage * 0.9, this.particles);
                if (GameState.currentRun) GameState.currentRun.damageDealt += p.damage * 0.9;
              }
              if (p.spawnFireHazard) {
                this.projectiles.spawnHazardArea(p.x, p.y, blast * 0.65, 3.5, 45, 'rgba(255, 69, 0, 0.6)', 'burn', true);
              }
            }

            // 神風自殺無人機引發連鎖大自爆與 AOE 濺射
            if (p.isHomingDrone) {
              this.particles.spawnExplosion(p.x, p.y);
              this.particles.spawnElectricSparks(p.x, p.y, 25);
              this.camera.shake(7.0, 0.18);
              AudioManager.playExplosion();
              for (const other of this.enemies) {
                if (other !== e && !other.isDead && Math.hypot(other.x - p.x, other.y - p.y) < 120) {
                  other.takeDamage(p.damage * 0.7, this.particles, 'shock', true);
                }
              }
            }

            // 彈射跳彈 (Ricochet) 物理折射
            if (p.ricochetCount && p.ricochetCount > 0) {
              p.ricochetCount--;
              let nearestOther: Enemy | null = null;
              let nearestDist = 260;
              for (const other of this.enemies) {
                if (other === e || other.isDead) continue;
                const od = Math.hypot(other.x - p.x, other.y - p.y);
                if (od < nearestDist) {
                  nearestDist = od;
                  nearestOther = other;
                }
              }
              if (nearestOther) {
                const bounceAngle = Math.atan2(nearestOther.y - p.y, nearestOther.x - p.x);
                p.vx = Math.cos(bounceAngle) * 650;
                p.vy = Math.sin(bounceAngle) * 650;
                p.damage *= 1.35;
                p.color = '#00e5ff';
                this.particles.spawnElectricSparks(p.x, p.y, 8);
                continue;
              }
            }

            p.pierce--;
            if (p.pierce <= 0) {
              this.projectiles.list.splice(i, 1);
              break;
            }
          }
        }

        // 玩家子彈擊中 Boss
        if (this.boss && !this.boss.isDead) {
          const dx = this.boss.x - p.x;
          const dy = this.boss.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < this.boss.radius + p.radius) {
            this.boss.takeDamage(p.damage, this.particles);
            if (GameState.currentRun) GameState.currentRun.damageDealt += p.damage;
            
            if (p.isTrap) {
              AudioManager.playShot('revolver');
              this.particles.spawnElectricSparks(p.x, p.y, 16);
              const trigAngle = Math.atan2(this.boss.y - p.y, this.boss.x - p.x);
              for (let bi = -1; bi <= 1; bi++) {
                const boltAngle = trigAngle + bi * 0.22;
                this.projectiles.spawnBullet(p.x, p.y, boltAngle, 800, p.damage * 1.5, true, '#d4af37', true, 999, 'bleed', 'crossbow_bolt');
              }
              this.particles.spawnMuzzleFlash(p.x, p.y, trigAngle, '#ffd700');
            }

            // 炸藥桶命中 Boss 觸發大範圍爆破
            if (p.isExplosive || p.visualType === 'dynamite') {
              this.particles.spawnExplosion(p.x, p.y);
              this.particles.spawnElectricSparks(p.x, p.y, 20);
              this.camera.shake(7.5, 0.2);
              AudioManager.playExplosion();
              const blast = p.blastRadius || 125;
              for (const e of this.enemies) {
                if (!e.isDead && Math.hypot(e.x - p.x, e.y - p.y) <= blast) {
                  e.takeDamage(p.damage * 0.9, this.particles, 'burn', true);
                }
              }
              if (p.spawnFireHazard) {
                this.projectiles.spawnHazardArea(p.x, p.y, blast * 0.65, 3.5, 45, 'rgba(255, 69, 0, 0.6)', 'burn', true);
              }
            } else if (p.isHomingDrone) {
              this.particles.spawnExplosion(p.x, p.y);
              this.particles.spawnElectricSparks(p.x, p.y, 25);
              this.camera.shake(7.5, 0.2);
              AudioManager.playExplosion();
            } else if (p.isHeavy) {
              this.hitstopTimer = 0.05;
              this.camera.shake(6.0, 0.14);
            } else {
              this.camera.shake(2.2, 0.07);
            }
            p.pierce--;
            if (p.pierce <= 0) {
              this.projectiles.list.splice(i, 1);
            }
          }
        }
      } else {
        // 敵人子彈擊中主角
        const dx = this.player.x - p.x;
        const dy = this.player.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.player.radius + p.radius) {
          const wasHit = this.player.takeDamage(p.damage, this.particles, p.x, p.y);
          if (wasHit) {
            this.camera.shake(6, 0.2);
            this.hitstopTimer = 0.04;
          }
          p.pierce--;
          if (p.pierce <= 0) {
            this.projectiles.list.splice(i, 1);
          }
        }
      }
    }
  }

  private advanceRoom(): 'next_room' | 'summary' {
    if (!GameState.currentRun) return 'summary';

    if (GameState.currentRun.roomIndex < 4) {
      GameState.currentRun.roomIndex++;
      this.initRoom();
      return 'next_room';
    } else {
      if (GameState.currentRun.zone < 6) {
        GameState.currentRun.zone++;
        GameState.currentRun.roomIndex = 1;
        this.initRoom();
        return 'next_room';
      } else {
        // ★ 無盡輪迴突破 (Endless Loop Transition)
        GameState.currentRun.loopCount++;
        GameState.currentRun.zone = 1;
        GameState.currentRun.roomIndex = 1;
        GameState.addCash(500); // 輪迴通關巨額黑金獎勵
        this.loopBannerText = `★ 進入黑金輪迴 第 ${GameState.currentRun.loopCount} 輪 ★ (敵人全屬性狂暴)`;
        this.loopBannerTimer = 4.0;
        this.initRoom();
        this.boonModal.open(); // 免費贈送一次自選傳奇天賦
        return 'next_room';
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const offX = -this.camera.getOffsetX();
    const offY = -this.camera.getOffsetY();

    ctx.save();
    // 深色鵝卵石地面
    ctx.fillStyle = '#12141a';
    ctx.fillRect(0, 0, 540, 960);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 540; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 960);
      ctx.stroke();
    }
    for (let y = 0; y < 960; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(540, y);
      ctx.stroke();
    }

    // 刷怪出生預警光圈
    for (const w of this.spawnWarnings) {
      ctx.save();
      const wx = w.x + offX;
      const wy = w.y + offY;
      ctx.fillStyle = w.isElite ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 23, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(wx, wy, w.isElite ? 28 : 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = w.isElite ? '#ffd700' : '#ff1744';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(wx, wy, (w.isElite ? 28 : 22) * (w.timer / 0.65), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 渲染戰術分支傳送門 (黑市商人 / 血祭神龕 / 挑戰金庫)
    if (this.isRoomCleared && this.roomGates.length > 0) {
      for (const gate of this.roomGates) {
        ctx.save();
        const gx = gate.x + offX;
        const gy = gate.y + offY;

        // 傳送門光暈與 Art Deco 拱門
        const pulse = 0.7 + Math.sin(Date.now() / 180) * 0.3;
        ctx.fillStyle = 'rgba(18, 20, 26, 0.92)';
        ctx.beginPath();
        ctx.roundRect(gx - gate.width / 2, gy - gate.height / 2, gate.width, gate.height, 8);
        ctx.fill();

        ctx.strokeStyle = gate.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = gate.color;
        ctx.shadowBlur = 12 * pulse;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 圖示與名稱
        ctx.fillStyle = gate.color;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gate.icon, gx, gy - 14);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(gate.label, gx, gy + 10);

        ctx.fillStyle = '#aaa';
        ctx.font = '9px sans-serif';
        ctx.fillText(gate.desc, gx, gy + 24);

        ctx.restore();
      }
    }

    // 實體渲染 (障礙物 -> 子彈 -> 怪物 -> Boss -> 玩家 -> 粒子)
    for (const obs of this.obstacles) obs.render(ctx, offX, offY);
    this.projectiles.render(ctx, offX, offY);
    for (const e of this.enemies) e.render(ctx, offX, offY);
    if (this.boss) this.boss.render(ctx, offX, offY);
    this.player.render(ctx, offX, offY);
    this.particles.render(ctx, offX, offY);

    // 黑色電影動態視野迷霧與戰術煙霧遮蔽渲染 (Noir Dynamic Vision & Smoke Occlusion)
    if (this.lightingCtx) {
      const lCtx = this.lightingCtx;
      lCtx.clearRect(0, 0, 540, 960);

      const isBossRoom = (GameState.currentRun && GameState.currentRun.roomIndex === 4);

      // 1. 全局黑色電影深邃夜色暗影 (BOSS 戰採用聚光燈開闊照明 0.35)
      lCtx.fillStyle = isBossRoom ? 'rgba(6, 8, 12, 0.35)' : 'rgba(6, 8, 12, 0.84)';
      lCtx.fillRect(0, 0, 540, 960);

      // 2. 刻蝕出玩家動態武器視野光錐 (Destination-out)
      lCtx.globalCompositeOperation = 'destination-out';

      const v = this.player.getVisionStats();
      const px = this.player.x + offX;
      const py = this.player.y + offY;

      // 2.1 周身直覺感知光暈 (Ambient vision)
      const ambGrad = lCtx.createRadialGradient(px, py, 15, px, py, v.ambientRadius);
      ambGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      ambGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
      ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      lCtx.fillStyle = ambGrad;
      lCtx.beginPath();
      lCtx.arc(px, py, v.ambientRadius, 0, Math.PI * 2);
      lCtx.fill();

      // 2.2 前方特定武器視錐 (Directional Vision Cone)
      if (v.angle < Math.PI * 2) {
        const facing = this.player.angle;
        const coneGrad = lCtx.createRadialGradient(px, py, 25, px, py, v.range);
        coneGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        coneGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.88)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        lCtx.fillStyle = coneGrad;
        lCtx.beginPath();
        lCtx.moveTo(px, py);
        lCtx.arc(px, py, v.range, facing - v.angle / 2, facing + v.angle / 2);
        lCtx.closePath();
        lCtx.fill();
      }

      // 2.3 伴飛無人機偵察探照光 (Drones Recon Searchlight)
      const droneCount = this.player.getTotalDroneCount();
      if (droneCount > 0) {
        for (let di = 0; di < droneCount; di++) {
          const orbitAngle = (Date.now() / 600) + (di * Math.PI * 2) / droneCount;
          const dx = px + Math.cos(orbitAngle) * 55;
          const dy = py + Math.sin(orbitAngle) * 55;
          const dGrad = lCtx.createRadialGradient(dx, dy, 5, dx, dy, 120);
          dGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
          dGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
          dGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
          lCtx.fillStyle = dGrad;
          lCtx.beginPath();
          lCtx.arc(dx, dy, 120, 0, Math.PI * 2);
          lCtx.fill();
        }
      }

      // 2.4 地面燃燒火海動態火光 (Fire Hazard Dynamic Glow)
      for (const p of this.projectiles.list) {
        if (p.isAreaHazard) {
          const hx = p.x + offX;
          const hy = p.y + offY;
          const hGrad = lCtx.createRadialGradient(hx, hy, 10, hx, hy, (p.blastRadius || 120) * 1.2);
          hGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
          hGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.75)');
          hGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
          lCtx.fillStyle = hGrad;
          lCtx.beginPath();
          lCtx.arc(hx, hy, (p.blastRadius || 120) * 1.2, 0, Math.PI * 2);
          lCtx.fill();
        }
      }

      // 2.5 Boss 威壓微光
      if (this.boss && !this.boss.isDead) {
        const bx = this.boss.x + offX;
        const by = this.boss.y + offY;
        const bGrad = lCtx.createRadialGradient(bx, by, 10, bx, by, 180);
        bGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        bGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        lCtx.fillStyle = bGrad;
        lCtx.beginPath();
        lCtx.arc(bx, by, 180, 0, Math.PI * 2);
        lCtx.fill();
      }

      // 3. 回復正常混合模式，繪製掩體幾何精確陰影投射 (Obstacle Dynamic Shadow Casting)
      if (!isBossRoom) {
        lCtx.globalCompositeOperation = 'source-over';
        lCtx.fillStyle = 'rgba(6, 8, 12, 0.86)';

        for (const obs of this.obstacles) {
          if (obs.isDead) continue;
          const ox = obs.x + offX;
          const oy = obs.y + offY;
          const odx = ox - px;
          const ody = oy - py;
          const odist = Math.hypot(odx, ody);
          if (odist <= obs.radius + 2 || odist > 800) continue;

          // 計算由玩家光源出發接觸圓形障礙物的兩條精確切線
          const centerAngle = Math.atan2(ody, odx);
          const sinAlpha = Math.min(0.999, obs.radius / odist);
          const alpha = Math.asin(sinAlpha);
          const cosAlpha = Math.sqrt(1 - sinAlpha * sinAlpha);
          const tangentLen = odist * cosAlpha;

          const a1 = centerAngle - alpha;
          const a2 = centerAngle + alpha;

          // 切點精確位於障礙物圓周邊緣
          const t1x = px + Math.cos(a1) * tangentLen;
          const t1y = py + Math.sin(a1) * tangentLen;
          const t2x = px + Math.cos(a2) * tangentLen;
          const t2y = py + Math.sin(a2) * tangentLen;

          // 沿切線方向向後延伸投射陰影
          const shadowDist = 800;
          const f1x = t1x + Math.cos(a1) * shadowDist;
          const f1y = t1y + Math.sin(a1) * shadowDist;
          const f2x = t2x + Math.cos(a2) * shadowDist;
          const f2y = t2y + Math.sin(a2) * shadowDist;

          // 構造精確幾何陰影多邊形：切點1 -> 遠端1 -> 遠端2 -> 切點2
          lCtx.beginPath();
          lCtx.moveTo(t1x, t1y);
          lCtx.lineTo(f1x, f1y);
          lCtx.lineTo(f2x, f2y);
          lCtx.lineTo(t2x, t2y);
          lCtx.closePath();
          lCtx.fill();

          // 填滿障礙物背部暗影半球
          lCtx.beginPath();
          lCtx.arc(ox, oy, obs.radius, a2, a1, false);
          lCtx.fill();
        }
      }

      // 4. 戰術煙霧在遮罩層開闢清晰視野 (避免黑霧遮擋子彈與主角)
      lCtx.globalCompositeOperation = 'destination-out';
      for (const s of this.particles.smokeClouds) {
        const sx = s.x + offX;
        const sy = s.y + offY;
        const smGrad = lCtx.createRadialGradient(sx, sy, 5, sx, sy, s.radius);
        smGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        smGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
        smGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lCtx.fillStyle = smGrad;
        lCtx.beginPath();
        lCtx.arc(sx, sy, s.radius, 0, Math.PI * 2);
        lCtx.fill();
      }

      // 5. 將動態視野光影遮罩覆蓋到主畫布
      ctx.drawImage(this.lightingCanvas, 0, 0);
    }

    ctx.restore();

    // HUD 渲染 (傳遞 Style Rank、Combo 數與波次梯隊)
    this.hud.render(ctx, this.player, this.boss, this.styleRank, this.comboCount, this.currentWave, this.totalWaves);
    this.touchControls.render(ctx);

    // 戰場肅清橫幅 (Room Clear Banner)
    if (this.roomClearBannerTimer > 0) {
      ctx.save();
      const alpha = Math.min(1.0, this.roomClearBannerTimer / 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(15, 17, 21, 0.9)';
      ctx.fillRect(40, 220, 460, 56);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 220, 460, 56);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`★ 戰場肅清 ROOM CLEARED ★ 【評價: ${this.styleRank}】`, 270, 248);
      ctx.restore();
    }

    // Boss 登場黑色電影大字橫幅與金句定格
    if (this.bossIntroTimer > 0 && this.boss && !this.boss.isDead) {
      ctx.save();
      const alpha = Math.min(1.0, this.bossIntroTimer / 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(8, 9, 12, 0.88)';
      ctx.fillRect(20, 140, 500, 110);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 140, 500, 110);

      // Boss 稱號與姓名
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 21px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`【${this.boss.info.title}】 ${this.boss.info.name}`, 270, 175);

      // 黑色電影氛圍金句語錄
      ctx.fillStyle = '#e5dfd3';
      ctx.font = 'italic 14px sans-serif';
      ctx.fillText(this.boss.info.quote || '「黑金與罪惡，是巴黎永恆的基調。」', 270, 215);
      ctx.restore();
    }

    // 解鎖新神兵橫幅
    if (this.unlockBannerTimer > 0 && this.unlockBannerText) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 17, 21, 0.92)';
      ctx.fillRect(40, 150, 460, 60);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 150, 460, 60);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.unlockBannerText, 270, 180);
      ctx.restore();
    }

    // 無盡輪迴升級橫幅
    if (this.loopBannerTimer > 0 && this.loopBannerText) {
      ctx.save();
      ctx.fillStyle = 'rgba(180, 0, 0, 0.9)';
      ctx.fillRect(30, 260, 480, 64);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(30, 260, 480, 64);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.loopBannerText, 270, 292);
      ctx.restore();
    }

    // 天賦三選一卡牌
    if (this.boonModal.isOpen) {
      this.boonModal.render(ctx);
    }

    // 禁酒令黑市商人介面
    if (this.merchantModal.isOpen) {
      this.merchantModal.render(ctx);
    }

    // 浮士德血祭神龕介面
    if (this.altarModal.isOpen) {
      this.altarModal.render(ctx);
    }

    // 軍火改裝台介面
    if (this.gunsmithModal.isOpen) {
      this.gunsmithModal.render(ctx);
    }

    // 暫停選單 (Esc / P)
    if (this.pauseModal.isOpen) {
      this.pauseModal.render(ctx);
    }
  }
}

