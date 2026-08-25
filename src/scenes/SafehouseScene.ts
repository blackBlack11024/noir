import { GameState, CocktailType } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { WEAPON_DATABASE, WeaponInfo } from '../data/WeaponDatabase';

export class SafehouseScene {
  public selectedPrimaryWeaponId: number = 1;
  public selectedSecondaryWeaponId: number = 1;
  public hoveredWeaponId: number = 1;
  public activeTab: 'combat' | 'bar' | 'bank' | 'shadow' = 'combat';

  public init() {
    AudioManager.setMood('safehouse');
    // 校驗已選武器是否合法解鎖
    if (!GameState.unlockedWeapons.includes(this.selectedPrimaryWeaponId)) {
      this.selectedPrimaryWeaponId = GameState.unlockedWeapons[0] || 1;
    }
    if (!GameState.unlockedWeapons.includes(this.selectedSecondaryWeaponId)) {
      this.selectedSecondaryWeaponId = this.selectedPrimaryWeaponId;
    }
  }

  public update(): 'start_run' | null {
    const mx = InputManager.mouseX;
    const my = InputManager.mouseY;

    // 計算當前 Hover 哪把武器
    for (let i = 0; i < 24; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = 26 + col * 123;
      const by = 74 + row * 36;
      if (mx >= bx && mx <= bx + 118 && my >= by && my <= by + 32) {
        this.hoveredWeaponId = i + 1;
      }
    }

    // 鍵盤數字鍵快速選取主手 (1~9)
    for (let i = 1; i <= 9; i++) {
      if (InputManager.isKeyJustPressed('Digit' + i)) {
        if (GameState.unlockedWeapons.includes(i)) {
          this.selectedPrimaryWeaponId = i;
          this.hoveredWeaponId = i;
          AudioManager.playSlash();
        }
      }
    }

    // F4 存檔重置快捷鍵
    if (InputManager.isKeyJustPressed('F4')) {
      GameState.resetSave();
      this.init();
      AudioManager.playHit();
    }

    // 空白鍵出發
    if (InputManager.isKeyJustPressed('Space')) {
      AudioManager.playShot('revolver');
      GameState.startNewRun(this.selectedPrimaryWeaponId, this.selectedSecondaryWeaponId);
      return 'start_run';
    }

    // 滑鼠右鍵點擊武器架：直接將該武器設為副手
    if (InputManager.isRmbJustPressed) {
      for (let i = 0; i < 24; i++) {
        const wid = i + 1;
        const col = i % 4;
        const row = Math.floor(i / 4);
        const bx = 26 + col * 123;
        const by = 74 + row * 36;
        if (mx >= bx && mx <= bx + 118 && my >= by && my <= by + 32) {
          if (GameState.unlockedWeapons.includes(wid)) {
            this.selectedSecondaryWeaponId = wid;
            this.hoveredWeaponId = wid;
            AudioManager.playSlash();
            InputManager.haptic(20);
          }
        }
      }
    }

    // 觸控與滑鼠左鍵點擊
    if (InputManager.isLmbJustPressed) {
      // 點擊頂部快捷全解鎖 (x: 370~514, y: 8~32)
      if (mx >= 370 && mx <= 514 && my >= 8 && my <= 32) {
        GameState.toggleDebugUnlock();
        this.init();
        AudioManager.playCash();
        InputManager.haptic(30);
      }

      // 點擊頂部重置存檔 (x: 26~140, y: 8~32)
      if (mx >= 26 && mx <= 140 && my >= 8 && my <= 32) {
        GameState.resetSave();
        this.init();
        AudioManager.playHit();
        InputManager.haptic(30);
      }

      // 點擊出發按鈕 (x: 90~450, y: 725~790)
      if (mx >= 90 && mx <= 450 && my >= 725 && my <= 790) {
        AudioManager.playShot('revolver');
        GameState.startNewRun(this.selectedPrimaryWeaponId, this.selectedSecondaryWeaponId);
        return 'start_run';
      }

      // 點擊武器架 (24 格)
      for (let i = 0; i < 24; i++) {
        const wid = i + 1;
        const col = i % 4;
        const row = Math.floor(i / 4);
        const bx = 26 + col * 123;
        const by = 74 + row * 36;
        if (mx >= bx && mx <= bx + 118 && my >= by && my <= by + 32) {
          this.hoveredWeaponId = wid;
          if (GameState.unlockedWeapons.includes(wid)) {
            this.selectedPrimaryWeaponId = wid;
            AudioManager.playSlash();
            InputManager.haptic(15);
          } else {
            AudioManager.playHit();
          }
        }
      }

      // 點擊情報卡中的【設為主手】按鈕 (x: 215~350, y: 410~445)
      const curW = WEAPON_DATABASE[this.hoveredWeaponId] || WEAPON_DATABASE[1];
      const isCurUnlocked = GameState.unlockedWeapons.includes(curW.id);
      if (isCurUnlocked) {
        if (mx >= 215 && mx <= 350 && my >= 410 && my <= 445) {
          this.selectedPrimaryWeaponId = curW.id;
          AudioManager.playSlash();
          InputManager.haptic(20);
        }
        // 點擊情報卡中的【設為副手】按鈕 (x: 360~495, y: 410~445)
        if (mx >= 360 && mx <= 495 && my >= 410 && my <= 445) {
          this.selectedSecondaryWeaponId = curW.id;
          AudioManager.playShot('revolver');
          InputManager.haptic(20);
        }
      }

      // 四大部門標籤頁切換 (y: 458~488)
      if (my >= 458 && my <= 488) {
        if (mx >= 26 && mx <= 146) { this.activeTab = 'combat'; AudioManager.playReload(); }
        else if (mx >= 150 && mx <= 268) { this.activeTab = 'bar'; AudioManager.playReload(); }
        else if (mx >= 272 && mx <= 388) { this.activeTab = 'bank'; AudioManager.playReload(); }
        else if (mx >= 392 && mx <= 514) { this.activeTab = 'shadow'; AudioManager.playReload(); }
      }

      // 處理各大部門養成點擊
      this.handleUpgradeClicks(mx, my);
    }

    return null;
  }

  private handleUpgradeClicks(mx: number, my: number) {
    const tryBuy = (cost: number, curLvl: number, maxLvl: number, onBuy: () => void) => {
      if (curLvl < maxLvl && GameState.totalCash >= cost) {
        GameState.totalCash -= cost;
        onBuy();
        GameState.save();
        AudioManager.playCash();
        InputManager.haptic(25);
      }
    };

    if (this.activeTab === 'combat') {
      if (mx >= 390 && mx <= 488 && my >= 512 && my <= 536) {
        const cost = 120 * (GameState.upgrades.critDamageLevel + 1);
        tryBuy(cost, GameState.upgrades.critDamageLevel, 5, () => GameState.upgrades.critDamageLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 538 && my <= 562) {
        const cost = 150 * (GameState.upgrades.parryReflectLevel + 1);
        tryBuy(cost, GameState.upgrades.parryReflectLevel, 5, () => GameState.upgrades.parryReflectLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 564 && my <= 588) {
        const cost = 140 * (GameState.upgrades.quickSwapLevel + 1);
        tryBuy(cost, GameState.upgrades.quickSwapLevel, 5, () => GameState.upgrades.quickSwapLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 590 && my <= 614) {
        const cost = 100 * (GameState.upgrades.reloadSpeedLevel + 1);
        tryBuy(cost, GameState.upgrades.reloadSpeedLevel, 5, () => GameState.upgrades.reloadSpeedLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 616 && my <= 640) {
        const cost = 160 * (GameState.upgrades.heavyMasteryLevel + 1);
        tryBuy(cost, GameState.upgrades.heavyMasteryLevel, 5, () => GameState.upgrades.heavyMasteryLevel++);
      }
    } else if (this.activeTab === 'bar') {
      const cocktails: CocktailType[] = ['absinthe', 'bloody_mary', 'godfather', 'cryo_gin'];
      for (let i = 0; i < 4; i++) {
        const cy = 512 + i * 32;
        if (mx >= 40 && mx <= 490 && my >= cy && my <= cy + 28) {
          GameState.upgrades.selectedCocktail = GameState.upgrades.selectedCocktail === cocktails[i] ? null : cocktails[i];
          GameState.save();
          AudioManager.playShot('revolver');
          InputManager.haptic(20);
        }
      }
    } else if (this.activeTab === 'bank') {
      if (mx >= 390 && mx <= 488 && my >= 512 && my <= 536) {
        const cost = 180 * (GameState.upgrades.bankInterestLevel + 1);
        tryBuy(cost, GameState.upgrades.bankInterestLevel, 5, () => GameState.upgrades.bankInterestLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 538 && my <= 562) {
        const cost = 150 * (GameState.upgrades.rerollDiscountLevel + 1);
        tryBuy(cost, GameState.upgrades.rerollDiscountLevel, 5, () => GameState.upgrades.rerollDiscountLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 564 && my <= 588) {
        const cost = 200 * (GameState.upgrades.startingCashLevel + 1);
        tryBuy(cost, GameState.upgrades.startingCashLevel, 5, () => GameState.upgrades.startingCashLevel++);
      }
    } else if (this.activeTab === 'shadow') {
      if (mx >= 390 && mx <= 488 && my >= 512 && my <= 536) {
        const cost = 100 * (GameState.upgrades.hpLevel + 1);
        tryBuy(cost, GameState.upgrades.hpLevel, 10, () => GameState.upgrades.hpLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 538 && my <= 562) {
        const cost = 150 * (GameState.upgrades.speedLevel + 1);
        tryBuy(cost, GameState.upgrades.speedLevel, 5, () => GameState.upgrades.speedLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 564 && my <= 588) {
        const cost = 200 * (GameState.upgrades.bulletTimeLevel + 1);
        tryBuy(cost, GameState.upgrades.bulletTimeLevel, 5, () => GameState.upgrades.bulletTimeLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 590 && my <= 614) {
        const cost = 180 * (GameState.upgrades.executionLevel + 1);
        tryBuy(cost, GameState.upgrades.executionLevel, 5, () => GameState.upgrades.executionLevel++);
      }
      if (mx >= 390 && mx <= 488 && my >= 616 && my <= 640) {
        const cost = 600;
        if (!GameState.upgrades.revivalUnlocked && GameState.totalCash >= cost) {
          GameState.totalCash -= cost;
          GameState.upgrades.revivalUnlocked = true;
          GameState.save();
          AudioManager.playCash();
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // 背景
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, 540, 960);

    // 標題
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('夜鶯庇護所 安全屋酒吧', 270, 28);

    ctx.fillStyle = '#888';
    ctx.font = '10.5px sans-serif';
    ctx.fillText('點擊武器選定 | 下方卡片可設主/副手 | 擊敗頭目解鎖神兵', 270, 48);

    // 快捷解鎖與存檔重置按鈕
    ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
    ctx.fillRect(26, 8, 95, 22);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 8, 95, 22);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('重置存檔 (F4)', 73, 23);

    ctx.fillStyle = GameState.debugAllUnlocked ? '#2ecc71' : 'rgba(212, 175, 55, 0.2)';
    ctx.fillRect(390, 8, 124, 22);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(390, 8, 124, 22);

    ctx.fillStyle = GameState.debugAllUnlocked ? '#000' : '#ffd700';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(GameState.debugAllUnlocked ? '全神兵已解鎖' : '測試全解鎖 (F1)', 452, 23);

    // 武器陳列架 (24 格)
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('黑幫武器庫 (首殺解鎖):', 26, 66);

    for (let i = 0; i < 24; i++) {
      const wid = i + 1;
      const wInfo = WEAPON_DATABASE[wid];
      const isUnlocked = GameState.unlockedWeapons.includes(wid);
      const isPrimary = this.selectedPrimaryWeaponId === wid;
      const isSecondary = this.selectedSecondaryWeaponId === wid;
      const isHovered = this.hoveredWeaponId === wid;

      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = 26 + col * 123;
      const by = 74 + row * 36;

      ctx.fillStyle = isPrimary ? '#2a2618' : (isSecondary ? '#1a242f' : (isHovered ? '#1c1f2b' : (isUnlocked ? '#16181f' : '#101217')));
      ctx.fillRect(bx, by, 118, 32);

      ctx.strokeStyle = isPrimary ? '#ffd700' : (isSecondary ? '#3498db' : (isHovered ? '#fff' : (isUnlocked ? '#444' : '#222')));
      ctx.lineWidth = (isPrimary || isSecondary) ? 2 : (isHovered ? 1.5 : 1);
      ctx.strokeRect(bx, by, 118, 32);

      // 未解鎖神兵黑影剪影遮罩
      if (isUnlocked) {
        ctx.fillStyle = wInfo ? wInfo.color : '#fff';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(wInfo ? wInfo.name : '武器 ' + wid, bx + 59, by + 14);

        let badge = wInfo ? wInfo.category.toUpperCase() : '';
        if (isPrimary && isSecondary) badge = '[主/副手]';
        else if (isPrimary) badge = '[主手]';
        else if (isSecondary) badge = '[副手]';

        ctx.fillStyle = isPrimary ? '#ffd700' : (isSecondary ? '#3498db' : '#888');
        ctx.font = '8.5px sans-serif';
        ctx.fillText(badge, bx + 59, by + 26);
      } else {
        ctx.fillStyle = '#444';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('???', bx + 59, by + 14);

        ctx.fillStyle = '#666';
        ctx.font = '8.5px sans-serif';
        ctx.fillText('[未知神兵]', bx + 59, by + 26);
      }
    }

    // 武器詳情情報卡 (Tooltip)
    const curW = WEAPON_DATABASE[this.hoveredWeaponId] || WEAPON_DATABASE[1];
    const isCurUnlocked = GameState.unlockedWeapons.includes(curW.id);

    ctx.fillStyle = 'rgba(20, 23, 30, 0.96)';
    ctx.fillRect(26, 296, 488, 154);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(26, 296, 488, 154);

    if (isCurUnlocked) {
      ctx.fillStyle = curW.color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(curW.name + ' [' + curW.category.toUpperCase() + ']', 38, 316);

      ctx.fillStyle = '#bbb';
      ctx.font = '10.5px sans-serif';
      ctx.textAlign = 'left';
      const ammoTxt = curW.maxAmmo > 0 ? curW.maxAmmo + ' 發 (裝填 ' + curW.reloadTime + 's)' : '無限耐久 (真實近戰扇形)';
      ctx.fillText('威力: ' + curW.damage + '   |   彈匣: ' + ammoTxt, 38, 334);
      ctx.fillText('蓄力重攻: ' + curW.heavyDamage + ' 點威力 (蓄力 ' + curW.heavyChargeTime + 's)', 38, 352);

      // 專屬被動
      ctx.fillStyle = '#3498db';
      ctx.fillText('專屬被動: 【' + curW.passiveName + '】 ' + curW.passiveDesc, 38, 370);

      // 專屬特技
      ctx.fillStyle = '#ffd700';
      ctx.fillText('終極特技: 【' + curW.skillName + '】 (CD ' + curW.skillCooldown + 's) - ' + curW.skillDesc, 38, 388);

      // 雙武器切換按鈕 (主手按鈕 + 副手按鈕)
      const isPri = this.selectedPrimaryWeaponId === curW.id;
      const isSec = this.selectedSecondaryWeaponId === curW.id;

      ctx.fillStyle = isPri ? '#2a2618' : '#14161f';
      ctx.fillRect(215, 410, 135, 30);
      ctx.strokeStyle = isPri ? '#ffd700' : '#888';
      ctx.lineWidth = isPri ? 2 : 1;
      ctx.strokeRect(215, 410, 135, 30);
      ctx.fillStyle = isPri ? '#ffd700' : '#aaa';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isPri ? '✓ 當前主要武器' : '設為主要武器', 282, 429);

      ctx.fillStyle = isSec ? '#1a242f' : '#14161f';
      ctx.fillRect(360, 410, 135, 30);
      ctx.strokeStyle = isSec ? '#3498db' : '#888';
      ctx.lineWidth = isSec ? 2 : 1;
      ctx.strokeRect(360, 410, 135, 30);
      ctx.fillStyle = isSec ? '#3498db' : '#aaa';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isSec ? '✓ 當前副手佩槍' : '設為副手佩槍', 427, 429);
    } else {
      ctx.fillStyle = '#777';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('??? [ 未知神兵 ]', 38, 318);

      ctx.fillStyle = '#ff5252';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('獲取途徑: 首殺【' + curW.bossSource + '】', 500, 318);

      ctx.fillStyle = '#888';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('戰鬥屬性: ？？？（擊敗首領繳獲入庫後鑑定）', 38, 348);
      ctx.fillText('專屬被動: ？？？（未知黑幫殺戮特性）', 38, 372);
      ctx.fillText('終極特技: ？？？（未知處刑特技）', 38, 396);

      ctx.fillStyle = '#666';
      ctx.font = 'italic 10.5px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('通關第 4 間 Boss 房擊敗該頭目即可永久入庫', 500, 432);
    }

    // 黑幫四大養成部門 (y: 458~715)
    ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.fillRect(26, 458, 488, 255);
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(26, 458, 488, 255);

    // 四大標籤頁 Tab
    const tabs = [
      { id: 'combat', name: '軍械精通', x: 26, w: 120 },
      { id: 'bar', name: '特調酒吧', x: 148, w: 118 },
      { id: 'bank', name: '黑市放貸', x: 268, w: 118 },
      { id: 'shadow', name: '夜行身手', x: 388, w: 126 }
    ];

    for (const t of tabs) {
      const isAct = this.activeTab === t.id;
      ctx.fillStyle = isAct ? '#2a2618' : '#14161f';
      ctx.fillRect(t.x, 460, t.w, 26);
      ctx.strokeStyle = isAct ? '#ffd700' : '#444';
      ctx.lineWidth = isAct ? 2 : 1;
      ctx.strokeRect(t.x, 460, t.w, 26);

      ctx.fillStyle = isAct ? '#ffd700' : '#888';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.name, t.x + t.w / 2, 477);
    }

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('持有黑金: $ ' + GameState.totalCash, 500, 502);

    // 渲染對應標籤頁內容
    this.renderTabContent(ctx);

    // 出發按鈕 (防切底上移)
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(90, 725, 360, 55);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 725, 360, 55);

    ctx.fillStyle = '#0f1115';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('踏入暗夜 展開清算 (TAP / SPACE)', 270, 759);

    ctx.restore();
  }

  private renderTabContent(ctx: CanvasRenderingContext2D) {
    const renderUpgradeRow = (y: number, name: string, levelTxt: string, cost: number, isMax: boolean) => {
      ctx.fillStyle = '#eee';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name + ': ' + levelTxt, 40, y + 16);

      const canBuy = !isMax && GameState.totalCash >= cost;
      ctx.fillStyle = isMax ? '#444' : (canBuy ? '#ffd700' : '#555');
      ctx.fillRect(390, y, 98, 22);

      ctx.fillStyle = isMax ? '#888' : (canBuy ? '#000' : '#aaa');
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isMax ? '已達上限' : '$' + cost + ' 升級', 439, y + 15);
    };

    if (this.activeTab === 'combat') {
      const c1 = 120 * (GameState.upgrades.critDamageLevel + 1);
      renderUpgradeRow(512, '致命暴擊傷害', 'Lv ' + GameState.upgrades.critDamageLevel + '/5 (暴傷 +' + (GameState.upgrades.critDamageLevel * 15) + '%)', c1, GameState.upgrades.critDamageLevel >= 5);

      const c2 = 150 * (GameState.upgrades.parryReflectLevel + 1);
      renderUpgradeRow(538, '切彈反彈劍氣', 'Lv ' + GameState.upgrades.parryReflectLevel + '/5 (反彈威力 +' + (GameState.upgrades.parryReflectLevel * 40) + '%)', c2, GameState.upgrades.parryReflectLevel >= 5);

      const c3 = 140 * (GameState.upgrades.quickSwapLevel + 1);
      renderUpgradeRow(564, '雙槍秒切增傷', 'Lv ' + GameState.upgrades.quickSwapLevel + '/5 (切槍2秒內傷害 +' + (GameState.upgrades.quickSwapLevel * 15) + '%)', c3, GameState.upgrades.quickSwapLevel >= 5);

      const c4 = 100 * (GameState.upgrades.reloadSpeedLevel + 1);
      renderUpgradeRow(590, '快速裝填戰術', 'Lv ' + GameState.upgrades.reloadSpeedLevel + '/5 (裝填速度 +' + (GameState.upgrades.reloadSpeedLevel * 10) + '%)', c4, GameState.upgrades.reloadSpeedLevel >= 5);

      const c5 = 160 * (GameState.upgrades.heavyMasteryLevel + 1);
      renderUpgradeRow(616, '重蓄力回彈掌控', 'Lv ' + GameState.upgrades.heavyMasteryLevel + '/5 (蓄力+' + (GameState.upgrades.heavyMasteryLevel * 15) + '%, 後搖-' + (GameState.upgrades.heavyMasteryLevel * 12) + '%)', c5, GameState.upgrades.heavyMasteryLevel >= 5);
    } else if (this.activeTab === 'bar') {
      const drinks = [
        { id: 'absinthe' as CocktailType, name: '綠仙子苦艾酒', desc: '翻滾無敵時間 +0.15 秒，移動速度 +15%' },
        { id: 'bloody_mary' as CocktailType, name: '血腥瑪麗', desc: '擊殺敵人 10% 機率直接汲取生命回復 2 HP' },
        { id: 'godfather' as CocktailType, name: '教父特調威士忌', desc: '所有攻擊傷害 +20%，但受到的傷害 +10%' },
        { id: 'cryo_gin' as CocktailType, name: '乾冰特調琴酒', desc: '所有武器攻擊自帶 15% 減速極寒冰凍效果' }
      ];

      for (let i = 0; i < drinks.length; i++) {
        const d = drinks[i];
        const isSel = GameState.upgrades.selectedCocktail === d.id;
        const dy = 512 + i * 30;

        ctx.fillStyle = isSel ? '#1e2b1f' : '#14161f';
        ctx.fillRect(40, dy, 450, 26);
        ctx.strokeStyle = isSel ? '#2ecc71' : '#444';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(40, dy, 450, 26);

        ctx.fillStyle = isSel ? '#2ecc71' : '#ffd700';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText((isSel ? '[已飲用] ' : '') + d.name, 48, dy + 12);

        ctx.fillStyle = '#bbb';
        ctx.font = '9px sans-serif';
        ctx.fillText(d.desc, 48, dy + 22);
      }
    } else if (this.activeTab === 'bank') {
      const c1 = 180 * (GameState.upgrades.bankInterestLevel + 1);
      renderUpgradeRow(512, '黑金存款利息', 'Lv ' + GameState.upgrades.bankInterestLevel + '/5 (每房利息 +' + (GameState.upgrades.bankInterestLevel * 2) + '%)', c1, GameState.upgrades.bankInterestLevel >= 5);

      const c2 = 150 * (GameState.upgrades.rerollDiscountLevel + 1);
      renderUpgradeRow(538, '黑市重骰人脈', 'Lv ' + GameState.upgrades.rerollDiscountLevel + '/5 (祝福重骰費用 -' + (GameState.upgrades.rerollDiscountLevel * 15) + '%)', c2, GameState.upgrades.rerollDiscountLevel >= 5);

      const c3 = 200 * (GameState.upgrades.startingCashLevel + 1);
      renderUpgradeRow(564, '洗錢初始本金', 'Lv ' + GameState.upgrades.startingCashLevel + '/5 (開局本金 +$' + (GameState.upgrades.startingCashLevel * 60) + ')', c3, GameState.upgrades.startingCashLevel >= 5);
    } else if (this.activeTab === 'shadow') {
      const c1 = 100 * (GameState.upgrades.hpLevel + 1);
      renderUpgradeRow(512, '老教父體魄', 'Lv ' + GameState.upgrades.hpLevel + '/10 (生命 +' + (GameState.upgrades.hpLevel * 10) + ')', c1, GameState.upgrades.hpLevel >= 10);

      const c2 = 150 * (GameState.upgrades.speedLevel + 1);
      renderUpgradeRow(538, '清道夫敏捷', 'Lv ' + GameState.upgrades.speedLevel + '/5 (移速 +' + (GameState.upgrades.speedLevel * 5) + '%)', c2, GameState.upgrades.speedLevel >= 5);

      const c3 = 200 * (GameState.upgrades.bulletTimeLevel + 1);
      renderUpgradeRow(564, '完美閃避子彈時間', 'Lv ' + GameState.upgrades.bulletTimeLevel + '/5 (慢動作 +' + (GameState.upgrades.bulletTimeLevel * 0.15).toFixed(2) + 's)', c3, GameState.upgrades.bulletTimeLevel >= 5);

      const c4 = 180 * (GameState.upgrades.executionLevel + 1);
      renderUpgradeRow(590, '殘血處決斬殺', 'Lv ' + GameState.upgrades.executionLevel + '/5 (低於' + (GameState.upgrades.executionLevel * 4) + '%斬殺)', c4, GameState.upgrades.executionLevel >= 5);

      renderUpgradeRow(616, '起死回生保命', GameState.upgrades.revivalUnlocked ? '已解鎖 (每輪1次免費復活)' : '未解鎖 (致命傷時原地復活)', 600, GameState.upgrades.revivalUnlocked);
    }

    // 底部犯罪戰績記錄 (y: 648~710)
    const statsY = 648;
    ctx.fillStyle = 'rgba(16, 20, 26, 0.85)';
    ctx.fillRect(36, statsY, 468, 60);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, statsY, 468, 60);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('夜鶯教父犯罪戰績 (CRIME LEDGER)', 46, statsY + 15);

    const cStats = GameState.careerStats;
    ctx.fillStyle = '#bbb';
    ctx.font = '9px sans-serif';
    ctx.fillText(`最高輪迴: Loop ${cStats.highestLoop || 1}  |  通關清算: ${cStats.totalVictories} 次  |  總出擊: ${cStats.totalRuns} 場`, 46, statsY + 31);
    ctx.fillText(`黑道擊殺: ${cStats.totalKills} 人  |  討伐頭目: ${cStats.totalBossesKilled} 位  |  神兵: ${GameState.unlockedWeapons.length}/24`, 46, statsY + 47);
  }
}



