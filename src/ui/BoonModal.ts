import { BOON_DATABASE, BoonInfo } from '../data/BoonDatabase';
import { GameState } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';

export class BoonModal {
  public isOpen: boolean = false;
  public choices: BoonInfo[] = [];
  public hoveredIndex: number = -1;

  public modalTitle: string = '教父家族黑道神賜';

  public open(forcedLegendaryOrDual: boolean = false, titleText?: string) {
    this.isOpen = true;
    this.modalTitle = titleText || '教父家族黑道神賜';
    AudioManager.playBoonCard();
    this.generateChoices(forcedLegendaryOrDual);
  }

  public close() {
    this.isOpen = false;
    this.hoveredIndex = -1;
  }

  private generateChoices(forcedLegendaryOrDual: boolean = false) {
    let pool = [...BOON_DATABASE];
    if (GameState.currentRun) {
      const owned = GameState.currentRun.activeBoons;
      const unowned = pool.filter(b => !owned.includes(b.id));
      if (unowned.length >= 3) pool = unowned;
    }

    if (forcedLegendaryOrDual) {
      const highTierPool = pool.filter(b => b.rarity === 'legendary' || b.faction === 'dual');
      const shuffled = (highTierPool.length >= 3 ? highTierPool : pool).sort(() => Math.random() - 0.5);
      this.choices = shuffled.slice(0, 3);
      return;
    }

    // 標準 Roguelite 加權稀有度抽取 (普通: 64%, 稀有: 26%, 史詩: 8%, 傳奇: 2%)
    const selected: BoonInfo[] = [];
    const selectedIds = new Set<string>();

    for (let slot = 0; slot < 3; slot++) {
      const roll = Math.random();
      let targetRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
      if (roll < 0.02) {
        targetRarity = 'legendary';
      } else if (roll < 0.10) {
        targetRarity = 'epic';
      } else if (roll < 0.36) {
        targetRarity = 'rare';
      } else {
        targetRarity = 'common';
      }

      let subPool = pool.filter(b => b.rarity === targetRarity && !selectedIds.has(b.id));
      if (subPool.length === 0) {
        subPool = pool.filter(b => !selectedIds.has(b.id));
      }

      if (subPool.length > 0) {
        const picked = subPool[Math.floor(Math.random() * subPool.length)];
        selected.push(picked);
        selectedIds.add(picked.id);
      }
    }

    this.choices = selected;
  }

  public update(): boolean {
    if (!this.isOpen) return false;

    const mx = InputManager.mouseX;
    const my = InputManager.mouseY;

    // 計算滑鼠 Hover 哪張卡牌
    this.hoveredIndex = -1;
    if (my >= 280 && my <= 660) {
      if (mx >= 26 && mx <= 178) this.hoveredIndex = 0;
      else if (mx >= 194 && mx <= 346) this.hoveredIndex = 1;
      else if (mx >= 362 && mx <= 514) this.hoveredIndex = 2;
    }

    // 鍵盤數字 1, 2, 3 秒選
    if (InputManager.isKeyJustPressed('Digit1') || InputManager.isKeyJustPressed('Numpad1')) {
      this.selectChoice(0);
      return true;
    }
    if (InputManager.isKeyJustPressed('Digit2') || InputManager.isKeyJustPressed('Numpad2')) {
      this.selectChoice(1);
      return true;
    }
    if (InputManager.isKeyJustPressed('Digit3') || InputManager.isKeyJustPressed('Numpad3')) {
      this.selectChoice(2);
      return true;
    }

    // R 鍵重擲 (Reroll)
    if (InputManager.isKeyJustPressed('KeyR')) {
      this.tryReroll();
    }

    // Space 鍵放棄 (Skip for cash)
    if (InputManager.isKeyJustPressed('Space')) {
      this.skipForCash();
      return true;
    }

    // 滑鼠點擊選卡
    if (InputManager.isLmbJustPressed) {
      if (this.hoveredIndex >= 0) {
        this.selectChoice(this.hoveredIndex);
        return true;
      }

      // 點擊重擲按鈕 (x: 50~230, y: 710~755)
      if (mx >= 50 && mx <= 230 && my >= 710 && my <= 755) {
        this.tryReroll();
      }

      // 點擊放棄按鈕 (x: 310~490, y: 710~755)
      if (mx >= 310 && mx <= 490 && my >= 710 && my <= 755) {
        this.skipForCash();
        return true;
      }
    }

    return false;
  }

  private tryReroll() {
    if (!GameState.currentRun) return;
    if (GameState.currentRun.rerollTokens > 0) {
      GameState.currentRun.rerollTokens--;
      this.generateChoices();
      AudioManager.playBoonCard();
      InputManager.haptic(25);
    } else if (GameState.currentRun.cash >= 50) {
      GameState.currentRun.cash -= 50;
      this.generateChoices();
      AudioManager.playBoonCard();
      InputManager.haptic(25);
    }
  }

  private skipForCash() {
    if (GameState.currentRun) {
      GameState.currentRun.cash += 80;
    }
    AudioManager.playCash();
    this.close();
  }

  private selectChoice(index: number) {
    if (index >= 0 && index < this.choices.length) {
      const chosen = this.choices[index];
      if (GameState.currentRun) {
        if (!GameState.currentRun.boonLevels) GameState.currentRun.boonLevels = {};
        if (GameState.currentRun.activeBoons.includes(chosen.id)) {
          const cur = GameState.currentRun.boonLevels[chosen.id] || 1;
          GameState.currentRun.boonLevels[chosen.id] = Math.min(3, cur + 1);
        } else {
          GameState.currentRun.activeBoons.push(chosen.id);
          GameState.currentRun.boonLevels[chosen.id] = 1;
        }
      }
      AudioManager.playCash();
      InputManager.haptic(30);
      this.close();
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isOpen) return;

    ctx.save();
    // 半透明深邃背景
    ctx.fillStyle = 'rgba(8, 9, 12, 0.94)';
    ctx.fillRect(0, 0, 540, 960);

    // 標題
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.modalTitle, 270, 195);

    ctx.fillStyle = '#888888';
    ctx.font = '12px sans-serif';
    ctx.fillText('點擊卡片或按鍵盤數字 1 2 3 選取 / 升階突破', 270, 222);

    // 3 張塔羅風格黑金卡牌
    const cardW = 152;
    const cardH = 370;
    const startY = 250;

    for (let i = 0; i < 3; i++) {
      const boon = this.choices[i];
      if (!boon) continue;
      const startX = 26 + i * 168;
      const isHover = this.hoveredIndex === i;
      const cardY = isHover ? startY - 8 : startY;
      const isOwned = GameState.currentRun?.activeBoons.includes(boon.id);
      const currentLevel = (GameState.currentRun?.boonLevels && GameState.currentRun.boonLevels[boon.id]) || 1;

      // 卡牌底色 (依稀有度呈現漸層質感)
      if (boon.rarity === 'legendary') {
        ctx.fillStyle = isHover ? '#2a2210' : '#1d170a';
      } else if (boon.rarity === 'epic') {
        ctx.fillStyle = isHover ? '#22152b' : '#170f1f';
      } else if (boon.rarity === 'rare') {
        ctx.fillStyle = isHover ? '#122230' : '#0d1822';
      } else {
        ctx.fillStyle = isHover ? '#1a1c24' : '#12141a';
      }
      ctx.fillRect(startX, cardY, cardW, cardH);

      const rarityColor = boon.rarity === 'legendary' ? '#ffd700' : (boon.rarity === 'epic' ? '#b388ff' : (boon.rarity === 'rare' ? '#64b5f6' : '#78909c'));
      ctx.strokeStyle = isHover ? '#ffffff' : (isOwned ? '#00e5ff' : rarityColor);
      ctx.lineWidth = isHover ? 3 : (boon.rarity === 'legendary' ? 2.8 : (boon.rarity === 'epic' ? 2 : 1.2));
      ctx.strokeRect(startX, cardY, cardW, cardH);

      // 稀有度專屬霓虹光暈
      if (boon.rarity === 'legendary') {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 16;
      } else if (boon.rarity === 'epic') {
        ctx.shadowColor = '#b388ff';
        ctx.shadowBlur = 10;
      } else if (boon.rarity === 'rare') {
        ctx.shadowColor = '#64b5f6';
        ctx.shadowBlur = 6;
      }

      // 卡牌派系膠囊標籤 / 升階標籤
      ctx.fillStyle = isOwned ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(startX + 12, cardY + 12, cardW - 24, 22);
      ctx.fillStyle = isOwned ? '#00e5ff' : rarityColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelText = isOwned ? `★ 升階突破 (Lv.${currentLevel + 1})` : boon.faction.toUpperCase();
      ctx.fillText(labelText, startX + cardW / 2, cardY + 23);

      // 卡牌名稱
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(boon.name, startX + cardW / 2, cardY + 58);

      // 稀有度標籤
      const rarityName = boon.rarity === 'legendary' ? '傳奇 質變神技' : (boon.rarity === 'epic' ? '史詩 核心強化' : (boon.rarity === 'rare' ? '稀有 戰術特技' : '普通 基礎增幅'));
      ctx.fillStyle = rarityColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rarityName, startX + cardW / 2, cardY + 80);

      // 分隔金線
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX + 16, cardY + 94);
      ctx.lineTo(startX + cardW - 16, cardY + 94);
      ctx.stroke();

      // 卡牌效果說明
      ctx.fillStyle = '#d5d8dc';
      ctx.font = '11.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const descText = isOwned ? `【突破】效果數值大幅翻倍強化！\n${boon.desc}` : boon.desc;
      this.wrapText(ctx, descText, startX + 12, cardY + 104, cardW - 24, 16);

      // 選擇按鈕標籤
      ctx.fillStyle = isHover ? '#ffd700' : 'rgba(212, 175, 55, 0.15)';
      ctx.fillRect(startX + 10, cardY + cardH - 44, cardW - 20, 32);
      ctx.strokeStyle = isOwned ? '#00e5ff' : '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX + 10, cardY + cardH - 44, cardW - 20, 32);

      ctx.fillStyle = isHover ? '#000' : (isOwned ? '#00e5ff' : '#ffd700');
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const btnText = isOwned ? `按 ${i + 1} 升至 Lv.${currentLevel + 1}` : `按 ${i + 1} 獲取`;
      ctx.fillText(btnText, startX + cardW / 2, cardY + cardH - 28);

      ctx.shadowBlur = 0;
    }

    // 底部戰術輔助按鈕 (重擲 / 放棄)
    const tokens = GameState.currentRun?.rerollTokens || 0;
    const canReroll = tokens > 0 || (GameState.currentRun && GameState.currentRun.cash >= 50);
    
    // 重擲按鈕
    ctx.fillStyle = canReroll ? '#1c1f2b' : '#141416';
    ctx.fillRect(50, 690, 190, 42);
    ctx.strokeStyle = canReroll ? '#ffd700' : '#444';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(50, 690, 190, 42);

    ctx.fillStyle = canReroll ? '#ffd700' : '#666';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rerollText = tokens > 0 ? `🎲 命運重骰 (${tokens}次免費) [R]` : `🎲 命運重骰 ($50) [R]`;
    ctx.fillText(rerollText, 145, 711);

    // 放棄按鈕
    ctx.fillStyle = '#1c1f2b';
    ctx.fillRect(300, 690, 190, 42);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(300, 690, 190, 42);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('放棄領取 $80 [Space]', 395, 711);

    ctx.restore();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const chars = text.split('');
    let line = '';
    let currentY = y;

    for (let n = 0; n < chars.length; n++) {
      const testLine = line + chars[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = chars[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }
}

