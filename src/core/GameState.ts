import { WEAPON_DATABASE } from '../data/WeaponDatabase';

export type CocktailType = 'absinthe' | 'bloody_mary' | 'godfather' | 'cryo_gin' | null;
export type PassportType = 'default' | 'hitman' | 'bootlegger' | 'high_roller' | 'brawler' | 'cyber_tinkerer';

export interface MafiaUpgrades {
  // 1. 軍械精通 (Combat Lab)
  critDamageLevel: number;    // 0 ~ 5 (+15% 暴傷/級)
  parryReflectLevel: number;  // 0 ~ 5 (切彈反彈威力 +40%/級)
  quickSwapLevel: number;     // 0 ~ 5 (切槍後 2 秒內增傷 +15%/級)
  reloadSpeedLevel: number;   // 0 ~ 5 (裝填速度 +10%/級)
  heavyMasteryLevel: number;  // 0 ~ 5 (重擊蓄力速度 +15%/級，後搖回彈縮短 -12%/級)

  // 2. 禁酒令調酒吧 (Speakeasy)
  selectedCocktail: CocktailType;
  secondaryCocktail: CocktailType;

  // 3. 黑市放貸與銀行 (Underworld Bank)
  bankInterestLevel: number;   // 0 ~ 5 (每過一關黑金利息 +2%/級)
  rerollDiscountLevel: number; // 0 ~ 5 (重骰折扣 -15%/級)
  startingCashLevel: number;   // 0 ~ 5 (開局 +$60/級)

  // 4. 夜行者身手 (Shadow Arts)
  hpLevel: number;             // 0 ~ 10 (+10 HP/級)
  speedLevel: number;          // 0 ~ 5 (+5% 移速/級)
  bulletTimeLevel: number;     // 0 ~ 5 (完美閃避子彈時間延長 0.15s/級)
  executionLevel: number;      // 0 ~ 5 (殘血處決閾值 +4%/級)
  revivalUnlocked: boolean;    // 每輪 1 次免費保命復活

  // 5. 五大黑道身份執照 (Mafia Passports)
  selectedPassport: PassportType;
  unlockedPassports: PassportType[];
}

export interface CareerStats {
  highestLoop: number;
  totalVictories: number;
  totalKills: number;
  lifetimeCash: number;
  totalRuns: number;
  totalBossesKilled: number;
}

export interface RunSummary {
  isVictory: boolean;
  zone: number;
  loopCount: number;
  roomsCleared: number;
  kills: number;
  cashEarned: number;
  damageDealt: number;
  durationSeconds: number;
  styleRank: string;
  unlockedWeaponName?: string;
  activeBoons: string[];
}

export interface RunState {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  cash: number;
  zone: number;
  roomIndex: number;
  loopCount: number; // 無盡輪迴輪數 (預設 1)
  primaryWeaponId: number;
  secondaryWeaponId: number;
  currentWeaponSlot: 0 | 1; // 0: primary, 1: secondary
  primaryAmmo: number;
  secondaryAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  activeBoons: string[];
  boonLevels: { [boonId: string]: number }; // Lv.1, Lv.2, Lv.3 (MAX)
  rerollTokens: number;
  cursePacts: string[];
  weaponMutations: { [weaponId: number]: string };
  activeSummonedDrones?: number; // 局內召喚的常駐伴飛無人機數量（關卡間保留）
  heatLevel: number; // 0 ~ 5
  heatScore: number;
  styleScore: number;
  styleRank: string; // D, C, B, A, S, SSS
  comboCount: number;
  comboTimer: number;
  kills: number;
  damageDealt: number;
  startTime: number;
  roomsCleared: number;
  selectedCocktail: CocktailType;
  secondaryCocktail: CocktailType;
  passport: PassportType;
}

class GameStateManager {
  public totalCash: number = 0;
  public unlockedWeapons: number[] = [1]; // 預設僅解鎖 1 號仕紳手杖劍
  public defeatedBosses: number[] = [];
  public upgrades: MafiaUpgrades = this.getDefaultUpgrades();
  public careerStats: CareerStats = {
    highestLoop: 1,
    totalVictories: 0,
    totalKills: 0,
    lifetimeCash: 0,
    totalRuns: 0,
    totalBossesKilled: 0
  };
  
  public currentRun: RunState | null = null;
  public lastRunSummary: RunSummary | null = null;
  public debugAllUnlocked: boolean = false;

  constructor() {
    this.load();
  }

  public getDefaultUpgrades(): MafiaUpgrades {
    return {
      critDamageLevel: 0,
      parryReflectLevel: 0,
      quickSwapLevel: 0,
      reloadSpeedLevel: 0,
      heavyMasteryLevel: 0,
      selectedCocktail: null,
      secondaryCocktail: null,
      bankInterestLevel: 0,
      rerollDiscountLevel: 0,
      startingCashLevel: 0,
      hpLevel: 0,
      speedLevel: 0,
      bulletTimeLevel: 0,
      executionLevel: 0,
      revivalUnlocked: false,
      selectedPassport: 'default',
      unlockedPassports: ['default', 'hitman', 'bootlegger', 'high_roller', 'brawler', 'cyber_tinkerer']
    };
  }

  public resetSave() {
    this.totalCash = 0;
    this.unlockedWeapons = [1];
    this.defeatedBosses = [];
    this.upgrades = this.getDefaultUpgrades();
    this.careerStats = {
      highestLoop: 1,
      totalVictories: 0,
      totalKills: 0,
      lifetimeCash: 0,
      totalRuns: 0,
      totalBossesKilled: 0
    };
    this.currentRun = null;
    this.lastRunSummary = null;
    this.debugAllUnlocked = false;
    this.save();
  }

  public startNewRun(startWeaponId: number = 1, secondaryWeaponId?: number): RunState {
    const bonusHp = this.upgrades.hpLevel * 10;
    const startCash = this.upgrades.startingCashLevel * 60;
    
    // 主副手武器嚴格限定已解鎖武器
    const validPrimary = this.unlockedWeapons.includes(startWeaponId) ? startWeaponId : (this.unlockedWeapons[0] || 1);
    let validSecondary = validPrimary;
    if (secondaryWeaponId && this.unlockedWeapons.includes(secondaryWeaponId)) {
      validSecondary = secondaryWeaponId;
    }

    const pWeapon = WEAPON_DATABASE[validPrimary] || WEAPON_DATABASE[1];
    const sWeapon = WEAPON_DATABASE[validSecondary] || WEAPON_DATABASE[1];

    this.careerStats.totalRuns++;

    const passport = this.upgrades.selectedPassport || 'default';
    let initMaxHp = 100 + bonusHp;
    if (passport === 'hitman') {
      initMaxHp = 60; // 冷血殺手：鎖死 60 血極致容錯
    }

    let initCash = startCash;
    if (passport === 'high_roller') {
      initCash = 0; // 亡命賭徒：身無分文開局
    }

    this.currentRun = {
      hp: initMaxHp,
      maxHp: initMaxHp,
      stamina: 3,
      maxStamina: 3,
      cash: initCash,
      zone: 1,
      roomIndex: 1,
      loopCount: 1,
      primaryWeaponId: validPrimary,
      secondaryWeaponId: validSecondary,
      currentWeaponSlot: 0,
      primaryAmmo: pWeapon.maxAmmo > 0 ? pWeapon.maxAmmo : 0,
      secondaryAmmo: sWeapon.maxAmmo > 0 ? sWeapon.maxAmmo : 0,
      isReloading: false,
      reloadTimer: 0,
      activeBoons: [],
      boonLevels: {},
      rerollTokens: 3,
      cursePacts: [],
      weaponMutations: {},
      activeSummonedDrones: 0,
      heatLevel: 0,
      heatScore: 0,
      styleScore: 0,
      styleRank: 'D',
      comboCount: 0,
      comboTimer: 0,
      kills: 0,
      damageDealt: 0,
      startTime: performance.now(),
      roomsCleared: 0,
      selectedCocktail: this.upgrades.selectedCocktail,
      secondaryCocktail: this.upgrades.secondaryCocktail,
      passport: passport
    };

    // g6 黑市高利貸天賦 (開局額外 300 黑金)
    if (this.currentRun.activeBoons.includes('g6')) {
      this.currentRun.cash += 300;
    }

    // 初始本金計入總黑金
    if (startCash > 0) {
      this.totalCash += startCash;
      this.careerStats.lifetimeCash += startCash;
    }

    this.save();
    return this.currentRun;
  }

  public unlockWeapon(weaponId: number): boolean {
    if (!this.unlockedWeapons.includes(weaponId)) {
      this.unlockedWeapons.push(weaponId);
      this.unlockedWeapons.sort((a, b) => a - b);
      this.save();
      return true;
    }
    return false;
  }

  public recordBossDefeat(bossId: number, weaponRewardId: number = bossId): boolean {
    if (!this.defeatedBosses.includes(bossId)) {
      this.defeatedBosses.push(bossId);
    }
    this.careerStats.totalBossesKilled++;
    const isFirstTime = !this.unlockedWeapons.includes(weaponRewardId);
    if (isFirstTime) {
      this.unlockWeapon(weaponRewardId);
    }
    this.save();
    return isFirstTime;
  }

  public addCash(amount: number) {
    this.totalCash += amount;
    this.careerStats.lifetimeCash += amount;
    if (this.currentRun) {
      this.currentRun.cash += amount;
    }
    this.save();
  }

  public endRun(victory: boolean, unlockedWeaponName?: string): RunSummary {
    let summary: RunSummary;
    if (this.currentRun) {
      const duration = Math.round((performance.now() - this.currentRun.startTime) / 1000);
      let rank = 'B';
      if (this.currentRun.kills > 35) rank = 'A';
      if (this.currentRun.kills > 60 || victory) rank = 'S';
      if (victory && this.currentRun.hp > this.currentRun.maxHp * 0.7) rank = 'SSS';

      if (victory) {
        this.careerStats.totalVictories++;
      }
      this.careerStats.totalKills += this.currentRun.kills;
      if (this.currentRun.loopCount > this.careerStats.highestLoop) {
        this.careerStats.highestLoop = this.currentRun.loopCount;
      }

      summary = {
        isVictory: victory,
        zone: this.currentRun.zone,
        loopCount: this.currentRun.loopCount,
        roomsCleared: this.currentRun.roomsCleared,
        kills: this.currentRun.kills,
        cashEarned: this.currentRun.cash,
        damageDealt: Math.round(this.currentRun.damageDealt),
        durationSeconds: duration,
        styleRank: rank,
        unlockedWeaponName,
        activeBoons: [...this.currentRun.activeBoons]
      };

      this.lastRunSummary = summary;
      this.save();
      this.currentRun = null;
    } else {
      summary = {
        isVictory: victory,
        zone: 1,
        loopCount: 1,
        roomsCleared: 0,
        kills: 0,
        cashEarned: 0,
        damageDealt: 0,
        durationSeconds: 0,
        styleRank: 'D',
        activeBoons: []
      };
    }
    return summary;
  }

  public toggleDebugUnlock() {
    this.debugAllUnlocked = !this.debugAllUnlocked;
    if (this.debugAllUnlocked) {
      for (let i = 1; i <= 24; i++) {
        if (!this.unlockedWeapons.includes(i)) this.unlockedWeapons.push(i);
      }
    } else {
      this.unlockedWeapons = [1];
    }
  }

  public save() {
    try {
      const data = {
        totalCash: this.totalCash,
        unlockedWeapons: this.unlockedWeapons,
        defeatedBosses: this.defeatedBosses,
        upgrades: this.upgrades,
        careerStats: this.careerStats
      };
      localStorage.setItem('le_milieu_noir_save', JSON.stringify(data));
    } catch (e) {}
  }

  public load() {
    try {
      const raw = localStorage.getItem('le_milieu_noir_save');
      if (raw) {
        const data = JSON.parse(raw);
        this.totalCash = data.totalCash || 0;
        this.unlockedWeapons = data.unlockedWeapons || [1];
        this.defeatedBosses = data.defeatedBosses || [];
        this.upgrades = { ...this.getDefaultUpgrades(), ...(data.upgrades || {}) };
        this.careerStats = { ...this.careerStats, ...(data.careerStats || {}) };
      }
    } catch (e) {}
  }
}

export const GameState = new GameStateManager();


