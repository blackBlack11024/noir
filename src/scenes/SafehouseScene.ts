import { GameState, CocktailType } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { WEAPON_DATABASE, WeaponInfo } from '../data/WeaponDatabase';

export class SafehouseScene {
  public selectedPrimaryWeaponId: number = 1;
  public selectedSecondaryWeaponId: number = 1;
  public hoveredWeaponId: number = 1;
  public activeTab: 'passport' | 'combat' | 'bar' | 'bank' | 'shadow' = 'passport';

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

  private getLayout() {
    const isTouch = InputManager.isTouchDevice;
    return {
      isTouch,
      headerTitleY: isTouch ? 28 : 36,
      headerSubY: isTouch ? 48 : 56,
      libTitleY: isTouch ? 66 : 84,
      gridStartY: isTouch ? 74 : 96,
      gridRowH: isTouch ? 36 : 42,
      gridBoxH: isTouch ? 32 : 36,
      cardY: isTouch ? 296 : 354,
      cardH: isTouch ? 154 : 170,
      cardBtnY: isTouch ? 410 : 484,
      upgBoxY: isTouch ? 458 : 530,
      upgBoxH: isTouch ? 255 : 352,
      tabY: isTouch ? 460 : 532,
      tabH: isTouch ? 26 : 28,
      upgRowBaseY: isTouch ? 512 : 588,
      upgRowGap: isTouch ? 26 : 34,
      cocktailBaseY: isTouch ? 512 : 582,
      cocktailGap: isTouch ? 30 : 36,
      statsY: isTouch ? 648 : 750,
      statsH: isTouch ? 60 : 122,
      startBtnX: isTouch ? 90 : 130,
      startBtnY: isTouch ? 725 : 895,
      startBtnW: isTouch ? 360 : 280,
      startBtnH: isTouch ? 55 : 50
    };
  }

  public update(): 'start_run' | null {
    const mx = InputManager.mouseX;
    const my = InputManager.mouseY;
    const L = this.getLayout();

    // 計算當前 Hover 哪把武器
    for (let i = 0; i < 24; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = 26 + col * 123;
      const by = L.gridStartY + row * L.gridRowH;
      if (mx >= bx && mx <= bx + 118 && my >= by && my <= by + L.gridBoxH) {
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
        const by = L.gridStartY + row * L.gridRowH;
        if (mx >= bx && mx <= bx + 118 && my >= by && my <= by + L.gridBoxH) {
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
      // 點擊出發按鈕
      if (mx >= L.startBtnX && mx <= L.startBtnX + L.startBtnW && my >= L.startBtnY && my <= L.startBtnY + L.startBtnH) {
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
        const by = L.gridStartY + row * L.gridRowH;
        if (mx >= bx && mx <= bx + 118 && my >= by && my <= by + L.gridBoxH) {
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

      // 點擊情報卡中的【設為主手】按鈕
      const curW = WEAPON_DATABASE[this.hoveredWeaponId] || WEAPON_DATABASE[1];
      const isCurUnlocked = GameState.unlockedWeapons.includes(curW.id);
      if (isCurUnlocked) {
        if (mx >= 215 && mx <= 350 && my >= L.cardBtnY && my <= L.cardBtnY + 32) {
          this.selectedPrimaryWeaponId = curW.id;
          AudioManager.playSlash();
          InputManager.haptic(20);
        }
        // 點擊情報卡中的【設為副手】按鈕
        if (mx >= 360 && mx <= 495 && my >= L.cardBtnY && my <= L.cardBtnY + 32) {
          this.selectedSecondaryWeaponId = curW.id;
          AudioManager.playShot('revolver');
          InputManager.haptic(20);
        }
      }

      // 五大部門標籤頁切換
      if (my >= L.tabY && my <= L.tabY + L.tabH) {
        if (mx >= 26 && mx <= 120) { this.activeTab = 'passport'; AudioManager.playReload(); }
        else if (mx >= 124 && mx <= 218) { this.activeTab = 'combat'; AudioManager.playReload(); }
        else if (mx >= 222 && mx <= 316) { this.activeTab = 'bar'; AudioManager.playReload(); }
        else if (mx >= 320 && mx <= 414) { this.activeTab = 'bank'; AudioManager.playReload(); }
        else if (mx >= 418 && mx <= 514) { this.activeTab = 'shadow'; AudioManager.playReload(); }
      }

      // 處理各大部門養成點擊
      this.handleUpgradeClicks(mx, my, L);
    }

    return null;
  }

  private handleUpgradeClicks(mx: number, my: number, L: ReturnType<typeof this.getLayout>) {
    const tryBuy = (cost: number, curLvl: number, maxLvl: number, onBuy: () => void) => {
      if (curLvl < maxLvl && GameState.totalCash >= cost) {
        GameState.totalCash -= cost;
        onBuy();
        GameState.save();
        AudioManager.playCash();
        InputManager.haptic(25);
      }
    };

    const rowH = L.isTouch ? 22 : 24;

    if (this.activeTab === 'passport') {
      const passports = ['default', 'hitman', 'bootlegger', 'high_roller', 'brawler', 'cyber_tinkerer'] as const;
      const pBoxH = L.isTouch ? 24 : 28;
      for (let i = 0; i < passports.length; i++) {
        const py = L.cocktailBaseY + i * (pBoxH + 6);
        if (mx >= 35 && mx <= 505 && my >= py && my <= py + pBoxH) {
          GameState.upgrades.selectedPassport = passports[i];
          GameState.save();
          AudioManager.playShot('revolver');
          InputManager.haptic(25);
          break;
        }
      }
    } else if (this.activeTab === 'combat') {
      for (let i = 0; i < 5; i++) {
        const ry = L.upgRowBaseY + i * L.upgRowGap;
        if (mx >= 390 && mx <= 488 && my >= ry && my <= ry + rowH) {
          if (i === 0) {
            const cost = 120 * (GameState.upgrades.critDamageLevel + 1);
            tryBuy(cost, GameState.upgrades.critDamageLevel, 5, () => GameState.upgrades.critDamageLevel++);
          } else if (i === 1) {
            const cost = 150 * (GameState.upgrades.parryReflectLevel + 1);
            tryBuy(cost, GameState.upgrades.parryReflectLevel, 5, () => GameState.upgrades.parryReflectLevel++);
          } else if (i === 2) {
            const cost = 140 * (GameState.upgrades.quickSwapLevel + 1);
            tryBuy(cost, GameState.upgrades.quickSwapLevel, 5, () => GameState.upgrades.quickSwapLevel++);
          } else if (i === 3) {
            const cost = 100 * (GameState.upgrades.reloadSpeedLevel + 1);
            tryBuy(cost, GameState.upgrades.reloadSpeedLevel, 5, () => GameState.upgrades.reloadSpeedLevel++);
          } else if (i === 4) {
            const cost = 160 * (GameState.upgrades.heavyMasteryLevel + 1);
            tryBuy(cost, GameState.upgrades.heavyMasteryLevel, 5, () => GameState.upgrades.heavyMasteryLevel++);
          }
        }
      }
    } else if (this.activeTab === 'bar') {
      const cocktails: CocktailType[] = ['absinthe', 'bloody_mary', 'godfather', 'cryo_gin'];
      const cBoxH = L.isTouch ? 26 : 32;
      for (let i = 0; i < 4; i++) {
        const cy = L.cocktailBaseY + i * L.cocktailGap;
        if (mx >= 40 && mx <= 490 && my >= cy && my <= cy + cBoxH) {
          GameState.upgrades.selectedCocktail = GameState.upgrades.selectedCocktail === cocktails[i] ? null : cocktails[i];
          GameState.save();
          AudioManager.playShot('revolver');
          InputManager.haptic(20);
        }
      }
    } else if (this.activeTab === 'bank') {
      for (let i = 0; i < 3; i++) {
        const ry = L.upgRowBaseY + i * L.upgRowGap;
        if (mx >= 390 && mx <= 488 && my >= ry && my <= ry + rowH) {
          if (i === 0) {
            const cost = 180 * (GameState.upgrades.bankInterestLevel + 1);
            tryBuy(cost, GameState.upgrades.bankInterestLevel, 5, () => GameState.upgrades.bankInterestLevel++);
          } else if (i === 1) {
            const cost = 150 * (GameState.upgrades.rerollDiscountLevel + 1);
            tryBuy(cost, GameState.upgrades.rerollDiscountLevel, 5, () => GameState.upgrades.rerollDiscountLevel++);
          } else if (i === 2) {
            const cost = 200 * (GameState.upgrades.startingCashLevel + 1);
            tryBuy(cost, GameState.upgrades.startingCashLevel, 5, () => GameState.upgrades.startingCashLevel++);
          }
        }
      }
    } else if (this.activeTab === 'shadow') {
      for (let i = 0; i < 5; i++) {
        const ry = L.upgRowBaseY + i * L.upgRowGap;
        if (mx >= 390 && mx <= 488 && my >= ry && my <= ry + rowH) {
          if (i === 0) {
            const cost = 100 * (GameState.upgrades.hpLevel + 1);
            tryBuy(cost, GameState.upgrades.hpLevel, 10, () => GameState.upgrades.hpLevel++);
          } else if (i === 1) {
            const cost = 150 * (GameState.upgrades.speedLevel + 1);
            tryBuy(cost, GameState.upgrades.speedLevel, 5, () => GameState.upgrades.speedLevel++);
          } else if (i === 2) {
            const cost = 200 * (GameState.upgrades.bulletTimeLevel + 1);
            tryBuy(cost, GameState.upgrades.bulletTimeLevel, 5, () => GameState.upgrades.bulletTimeLevel++);
          } else if (i === 3) {
            const cost = 180 * (GameState.upgrades.executionLevel + 1);
            tryBuy(cost, GameState.upgrades.executionLevel, 5, () => GameState.upgrades.executionLevel++);
          } else if (i === 4) {
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
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const L = this.getLayout();

    ctx.save();
    // 背景
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, 540, 960);

    // 標題 (法文優雅黑幫大標題)
    ctx.fillStyle = '#d4af37';
    ctx.font = L.isTouch ? 'bold 18px sans-serif' : 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Le Refuge du Rossignol', 270, L.headerTitleY);

    ctx.fillStyle = '#888';
    ctx.font = L.isTouch ? '10.5px sans-serif' : '11px sans-serif';
    ctx.fillText('點擊武器選定 | 卡片可設主/副手 | 擊敗頭目解鎖神兵', 270, L.headerSubY);

    // 武器陳列架 (24 格)
    ctx.fillStyle = '#ffd700';
    ctx.font = L.isTouch ? 'bold 11px sans-serif' : 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('黑幫武器庫 (首殺解鎖):', 26, L.libTitleY);

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
      const by = L.gridStartY + row * L.gridRowH;

      ctx.fillStyle = isPrimary ? '#2a2618' : (isSecondary ? '#1a242f' : (isHovered ? '#1c1f2b' : (isUnlocked ? '#16181f' : '#101217')));
      ctx.fillRect(bx, by, 118, L.gridBoxH);

      ctx.strokeStyle = isPrimary ? '#ffd700' : (isSecondary ? '#3498db' : (isHovered ? '#fff' : (isUnlocked ? '#444' : '#222')));
      ctx.lineWidth = (isPrimary || isSecondary) ? 2 : (isHovered ? 1.5 : 1);
      ctx.strokeRect(bx, by, 118, L.gridBoxH);

      // 未解鎖神兵黑影剪影遮罩
      if (isUnlocked) {
        ctx.fillStyle = wInfo ? wInfo.color : '#fff';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(wInfo ? wInfo.name : '武器 ' + wid, bx + 59, by + (L.isTouch ? 14 : 16));

        let badge = wInfo ? wInfo.category.toUpperCase() : '';
        if (isPrimary && isSecondary) badge = '[主/副手]';
        else if (isPrimary) badge = '[主手]';
        else if (isSecondary) badge = '[副手]';

        ctx.fillStyle = isPrimary ? '#ffd700' : (isSecondary ? '#3498db' : '#888');
        ctx.font = '8.5px sans-serif';
        ctx.fillText(badge, bx + 59, by + (L.isTouch ? 26 : 28));
      } else {
        ctx.fillStyle = '#444';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('???', bx + 59, by + (L.isTouch ? 14 : 16));

        ctx.fillStyle = '#666';
        ctx.font = '8.5px sans-serif';
        ctx.fillText('[未知神兵]', bx + 59, by + (L.isTouch ? 26 : 28));
      }
    }

    // 武器詳情情報卡 (Tooltip)
    const curW = WEAPON_DATABASE[this.hoveredWeaponId] || WEAPON_DATABASE[1];
    const isCurUnlocked = GameState.unlockedWeapons.includes(curW.id);

    ctx.fillStyle = 'rgba(20, 23, 30, 0.96)';
    ctx.fillRect(26, L.cardY, 488, L.cardH);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(26, L.cardY, 488, L.cardH);

    if (isCurUnlocked) {
      ctx.fillStyle = curW.color;
      ctx.font = L.isTouch ? 'bold 13px sans-serif' : 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(curW.name + ' [' + curW.category.toUpperCase() + ']', 38, L.cardY + 20);

      ctx.fillStyle = '#bbb';
      ctx.font = L.isTouch ? '10.5px sans-serif' : '11px sans-serif';
      ctx.textAlign = 'left';
      const ammoTxt = curW.maxAmmo > 0 ? curW.maxAmmo + ' 發 (裝填 ' + curW.reloadTime + 's)' : '無限耐久 (真實近戰扇形)';
      ctx.fillText('威力: ' + curW.damage + '   |   彈匣: ' + ammoTxt, 38, L.cardY + 38);
      ctx.fillText('蓄力重攻: ' + curW.heavyDamage + ' 點威力 (蓄力 ' + curW.heavyChargeTime + 's)', 38, L.cardY + 56);

      // 專屬被動
      ctx.fillStyle = '#3498db';
      ctx.fillText('專屬被動: 【' + curW.passiveName + '】 ' + curW.passiveDesc, 38, L.cardY + 74);

      // 專屬特技
      ctx.fillStyle = '#ffd700';
      ctx.fillText('終極特技: 【' + curW.skillName + '】 (CD ' + curW.skillCooldown + 's) - ' + curW.skillDesc, 38, L.cardY + 92);

      // 雙武器切換按鈕 (主手按鈕 + 副手按鈕)
      const isPri = this.selectedPrimaryWeaponId === curW.id;
      const isSec = this.selectedSecondaryWeaponId === curW.id;

      ctx.fillStyle = isPri ? '#2a2618' : '#14161f';
      ctx.fillRect(215, L.cardBtnY, 135, 30);
      ctx.strokeStyle = isPri ? '#ffd700' : '#888';
      ctx.lineWidth = isPri ? 2 : 1;
      ctx.strokeRect(215, L.cardBtnY, 135, 30);
      ctx.fillStyle = isPri ? '#ffd700' : '#aaa';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isPri ? '✓ 當前主要武器' : '設為主要武器', 282, L.cardBtnY + 19);

      ctx.fillStyle = isSec ? '#1a242f' : '#14161f';
      ctx.fillRect(360, L.cardBtnY, 135, 30);
      ctx.strokeStyle = isSec ? '#3498db' : '#888';
      ctx.lineWidth = isSec ? 2 : 1;
      ctx.strokeRect(360, L.cardBtnY, 135, 30);
      ctx.fillStyle = isSec ? '#3498db' : '#aaa';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isSec ? '✓ 當前副手佩槍' : '設為副手佩槍', 427, L.cardBtnY + 19);
    } else {
      ctx.fillStyle = '#777';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('??? [ 未知神兵 ]', 38, L.cardY + 22);

      ctx.fillStyle = '#ff5252';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('獲取途徑: 首殺【' + curW.bossSource + '】', 500, L.cardY + 22);

      ctx.fillStyle = '#888';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('戰鬥屬性: ？？？（擊敗首領繳獲入庫後鑑定）', 38, L.cardY + 48);
      ctx.fillText('專屬被動: ？？？（未知黑幫殺戮特性）', 38, L.cardY + 72);
      ctx.fillText('終極特技: ？？？（未知處刑特技）', 38, L.cardY + 96);

      ctx.fillStyle = '#666';
      ctx.font = 'italic 10.5px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('通關第 4 間 Boss 房擊敗該頭目即可永久入庫', 500, L.cardY + 130);
    }

    // 黑幫四大養成部門
    ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.fillRect(26, L.upgBoxY, 488, L.upgBoxH);
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(26, L.upgBoxY, 488, L.upgBoxH);

    // 五大標籤頁 Tab
    const tabs = [
      { id: 'passport' as const, name: '黑道執照', x: 26, w: 94 },
      { id: 'combat' as const, name: '軍械精通', x: 124, w: 94 },
      { id: 'bar' as const, name: '特調酒吧', x: 222, w: 94 },
      { id: 'bank' as const, name: '黑市放貸', x: 320, w: 94 },
      { id: 'shadow' as const, name: '夜行身手', x: 418, w: 96 }
    ];

    for (const t of tabs) {
      const isAct = this.activeTab === t.id;
      ctx.fillStyle = isAct ? '#2a2618' : '#14161f';
      ctx.fillRect(t.x, L.tabY, t.w, L.tabH);
      ctx.strokeStyle = isAct ? '#ffd700' : '#444';
      ctx.lineWidth = isAct ? 2 : 1;
      ctx.strokeRect(t.x, L.tabY, t.w, L.tabH);

      ctx.fillStyle = isAct ? '#ffd700' : '#888';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.name, t.x + t.w / 2, L.tabY + (L.isTouch ? 17 : 18));
    }

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('持有黑金: $ ' + GameState.totalCash, 500, L.tabY + (L.isTouch ? 42 : 46));

    // 渲染對應標籤頁內容
    this.renderTabContent(ctx, L);

    // 出發按鈕
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(L.startBtnX, L.startBtnY, L.startBtnW, L.startBtnH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(L.startBtnX, L.startBtnY, L.startBtnW, L.startBtnH);

    ctx.fillStyle = '#0f1115';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(L.isTouch ? '踏入暗夜 展開清算 (TAP)' : '踏入暗夜 展開清算 (Space)', L.startBtnX + L.startBtnW / 2, L.startBtnY + L.startBtnH / 2 + 6);

    ctx.restore();
  }

  private renderTabContent(ctx: CanvasRenderingContext2D, L: ReturnType<typeof this.getLayout>) {
    const renderUpgradeRow = (y: number, name: string, levelTxt: string, cost: number, isMax: boolean) => {
      ctx.fillStyle = '#eee';
      ctx.font = L.isTouch ? '11px sans-serif' : '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name + ': ' + levelTxt, 40, y + (L.isTouch ? 16 : 17));

      const canBuy = !isMax && GameState.totalCash >= cost;
      ctx.fillStyle = isMax ? '#444' : (canBuy ? '#ffd700' : '#555');
      const btnH = L.isTouch ? 22 : 24;
      ctx.fillRect(390, y, 98, btnH);

      ctx.fillStyle = isMax ? '#888' : (canBuy ? '#000' : '#aaa');
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isMax ? '已達上限' : '$' + cost + ' 升級', 439, y + (L.isTouch ? 15 : 16));
    };

    if (this.activeTab === 'passport') {
      const passports = [
        { id: 'default', name: '🎩 家族首領 (Godfather)', desc: '經典全能均衡黑道教父，全屬性無短板。' },
        { id: 'hitman', name: '🕶️ 冷血殺手 (Hitman)', desc: '翻滾無冷卻+暗影瞬移，背刺 350% 暴擊，但 MaxHP 鎖死 60。' },
        { id: 'bootlegger', name: '🍸 私酒大亨 (Bootlegger)', desc: '自釀私酒壺隨機特調，30% 醉步閃避+醉拳火海。' },
        { id: 'high_roller', name: '🎰 亡命賭徒 (High Roller)', desc: '$0 開局，50% 零元購免單 / 50% 雙倍，每殺 5 怪爆發 12 顆金幣。' },
        { id: 'brawler', name: '🥊 地下拳王 (Brawler)', desc: '雙持指虎/鋼盾，正面 80 度格擋免傷，連擋 3 次打出 8 倍音速衝擊波！' },
        { id: 'cyber_tinkerer', name: '🤖 機械狂徒 (Cyber Tinkerer)', desc: '開局常駐 2 架自律雷射僚機伴飛，翻滾自動佈設捕獸夾。' }
      ];

      const pBoxH = L.isTouch ? 24 : 28;
      for (let i = 0; i < passports.length; i++) {
        const p = passports[i];
        const isSel = (GameState.upgrades.selectedPassport || 'default') === p.id;
        const py = L.cocktailBaseY + i * (pBoxH + 6);

        ctx.fillStyle = isSel ? '#241a2f' : '#14161f';
        ctx.fillRect(35, py, 470, pBoxH);
        ctx.strokeStyle = isSel ? '#00e5ff' : '#444';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(35, py, 470, pBoxH);

        ctx.fillStyle = isSel ? '#00e5ff' : '#ffd700';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText((isSel ? '★ [已啟用] ' : '') + p.name, 42, py + (L.isTouch ? 11 : 12));

        ctx.fillStyle = '#ccc';
        ctx.font = '9.5px sans-serif';
        ctx.fillText(p.desc, 42, py + (L.isTouch ? 20 : 23));
      }
    } else if (this.activeTab === 'combat') {
      const c1 = 120 * (GameState.upgrades.critDamageLevel + 1);
      renderUpgradeRow(L.upgRowBaseY, '致命暴擊傷害', 'Lv ' + GameState.upgrades.critDamageLevel + '/5 (暴傷 +' + (GameState.upgrades.critDamageLevel * 15) + '%)', c1, GameState.upgrades.critDamageLevel >= 5);

      const c2 = 150 * (GameState.upgrades.parryReflectLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap, '切彈反彈劍氣', 'Lv ' + GameState.upgrades.parryReflectLevel + '/5 (反彈威力 +' + (GameState.upgrades.parryReflectLevel * 40) + '%)', c2, GameState.upgrades.parryReflectLevel >= 5);

      const c3 = 140 * (GameState.upgrades.quickSwapLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap * 2, '雙槍秒切增傷', 'Lv ' + GameState.upgrades.quickSwapLevel + '/5 (切槍2秒內傷害 +' + (GameState.upgrades.quickSwapLevel * 15) + '%)', c3, GameState.upgrades.quickSwapLevel >= 5);

      const c4 = 100 * (GameState.upgrades.reloadSpeedLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap * 3, '快速裝填戰術', 'Lv ' + GameState.upgrades.reloadSpeedLevel + '/5 (裝填速度 +' + (GameState.upgrades.reloadSpeedLevel * 10) + '%)', c4, GameState.upgrades.reloadSpeedLevel >= 5);

      const c5 = 160 * (GameState.upgrades.heavyMasteryLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap * 4, '重蓄力回彈掌控', 'Lv ' + GameState.upgrades.heavyMasteryLevel + '/5 (蓄力+' + (GameState.upgrades.heavyMasteryLevel * 15) + '%, 後搖-' + (GameState.upgrades.heavyMasteryLevel * 12) + '%)', c5, GameState.upgrades.heavyMasteryLevel >= 5);
    } else if (this.activeTab === 'bar') {
      const drinks = [
        { id: 'absinthe' as CocktailType, name: '綠仙子苦艾酒', desc: '翻滾無敵時間 +0.15 秒，移動速度 +15%' },
        { id: 'bloody_mary' as CocktailType, name: '血腥瑪麗', desc: '擊殺敵人 10% 機率直接汲取生命回復 2 HP' },
        { id: 'godfather' as CocktailType, name: '教父特調威士忌', desc: '所有攻擊傷害 +20%，但受到的傷害 +10%' },
        { id: 'cryo_gin' as CocktailType, name: '乾冰特調琴酒', desc: '所有武器攻擊自帶 15% 減速極寒冰凍效果' }
      ];

      const drinkBoxH = L.isTouch ? 26 : 32;
      for (let i = 0; i < drinks.length; i++) {
        const d = drinks[i];
        const isSel = GameState.upgrades.selectedCocktail === d.id;
        const dy = L.cocktailBaseY + i * L.cocktailGap;

        ctx.fillStyle = isSel ? '#1e2b1f' : '#14161f';
        ctx.fillRect(40, dy, 450, drinkBoxH);
        ctx.strokeStyle = isSel ? '#2ecc71' : '#444';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(40, dy, 450, drinkBoxH);

        ctx.fillStyle = isSel ? '#2ecc71' : '#ffd700';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText((isSel ? '[已飲用] ' : '') + d.name, 48, dy + (L.isTouch ? 12 : 14));

        ctx.fillStyle = '#bbb';
        ctx.font = '9px sans-serif';
        ctx.fillText(d.desc, 48, dy + (L.isTouch ? 22 : 26));
      }
    } else if (this.activeTab === 'bank') {
      const c1 = 180 * (GameState.upgrades.bankInterestLevel + 1);
      renderUpgradeRow(L.upgRowBaseY, '黑金存款利息', 'Lv ' + GameState.upgrades.bankInterestLevel + '/5 (每房利息 +' + (GameState.upgrades.bankInterestLevel * 2) + '%)', c1, GameState.upgrades.bankInterestLevel >= 5);

      const c2 = 150 * (GameState.upgrades.rerollDiscountLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap, '黑市重骰人脈', 'Lv ' + GameState.upgrades.rerollDiscountLevel + '/5 (祝福重骰費用 -' + (GameState.upgrades.rerollDiscountLevel * 15) + '%)', c2, GameState.upgrades.rerollDiscountLevel >= 5);

      const c3 = 200 * (GameState.upgrades.startingCashLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap * 2, '洗錢初始本金', 'Lv ' + GameState.upgrades.startingCashLevel + '/5 (開局本金 +$' + (GameState.upgrades.startingCashLevel * 60) + ')', c3, GameState.upgrades.startingCashLevel >= 5);
    } else if (this.activeTab === 'shadow') {
      const c1 = 100 * (GameState.upgrades.hpLevel + 1);
      renderUpgradeRow(L.upgRowBaseY, '老教父體魄', 'Lv ' + GameState.upgrades.hpLevel + '/10 (生命 +' + (GameState.upgrades.hpLevel * 10) + ')', c1, GameState.upgrades.hpLevel >= 10);

      const c2 = 150 * (GameState.upgrades.speedLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap, '清道夫敏捷', 'Lv ' + GameState.upgrades.speedLevel + '/5 (移速 +' + (GameState.upgrades.speedLevel * 5) + '%)', c2, GameState.upgrades.speedLevel >= 5);

      const c3 = 200 * (GameState.upgrades.bulletTimeLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap * 2, '完美閃避子彈時間', 'Lv ' + GameState.upgrades.bulletTimeLevel + '/5 (慢動作 +' + (GameState.upgrades.bulletTimeLevel * 0.15).toFixed(2) + 's)', c3, GameState.upgrades.bulletTimeLevel >= 5);

      const c4 = 180 * (GameState.upgrades.executionLevel + 1);
      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap * 3, '殘血處決斬殺', 'Lv ' + GameState.upgrades.executionLevel + '/5 (低於' + (GameState.upgrades.executionLevel * 4) + '%斬殺)', c4, GameState.upgrades.executionLevel >= 5);

      renderUpgradeRow(L.upgRowBaseY + L.upgRowGap * 4, '起死回生保命', GameState.upgrades.revivalUnlocked ? '已解鎖 (每輪1次免費復活)' : '未解鎖 (致命傷時原地復活)', 600, GameState.upgrades.revivalUnlocked);
    }

    // 底部犯罪戰績記錄
    ctx.fillStyle = 'rgba(16, 20, 26, 0.85)';
    ctx.fillRect(36, L.statsY, 468, L.statsH);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, L.statsY, 468, L.statsH);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('夜鶯教父犯罪戰績 (CRIME LEDGER)', 46, L.statsY + 16);

    const cStats = GameState.careerStats;
    ctx.fillStyle = '#bbb';
    ctx.font = '9.5px sans-serif';
    ctx.fillText(`最高輪迴: Loop ${cStats.highestLoop || 1}  |  通關清算: ${cStats.totalVictories} 次  |  總出擊: ${cStats.totalRuns} 場`, 46, L.statsY + 34);
    ctx.fillText(`黑道擊殺: ${cStats.totalKills} 人  |  討伐頭目: ${cStats.totalBossesKilled} 位  |  神兵: ${GameState.unlockedWeapons.length}/24`, 46, L.statsY + 50);

    // PC 端額外渲染進度條
    if (!L.isTouch) {
      const weaponPct = GameState.unlockedWeapons.length / 24;
      const bossPct = GameState.defeatedBosses.length / 24;

      ctx.fillStyle = '#d4af37';
      ctx.fillText(`神兵庫存: ${GameState.unlockedWeapons.length}/24`, 48, L.statsY + 76);
      ctx.fillText(`頭目討伐: ${GameState.defeatedBosses.length}/24`, 280, L.statsY + 76);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(48, L.statsY + 84, 190, 6);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(48, L.statsY + 84, 190 * weaponPct, 6);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(280, L.statsY + 84, 190, 6);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(280, L.statsY + 84, 190 * bossPct, 6);

      ctx.fillStyle = '#888';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('F4: 重置存檔', 490, L.statsY + 110);
    }
  }
}



