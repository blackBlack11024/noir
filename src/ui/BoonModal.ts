import { BOON_DATABASE, BoonInfo } from '../data/BoonDatabase';
import { GameState } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { WEAPON_MUTATIONS, WeaponMutation } from './GunsmithModal';
import { ALTAR_PACTS, AltarPact } from './AltarModal';

export interface RewardCard {
  id: string;
  category: 'boon' | 'mutation' | 'curse' | 'supply';
  name: string;
  badge: string;
  badgeColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'curse' | 'mutation' | 'supply';
  desc: string;
  isUpgrade?: boolean;
  currentLevel?: number;
  data?: any;
}

export class BoonModal {
  public isOpen: boolean = false;
  public choices: RewardCard[] = [];
  public hoveredIndex: number = -1;

  public modalTitle: string = '🎲 通關結算·命運三選一';

  public open(forcedLegendaryOrDual: boolean = false, titleText?: string) {
    this.isOpen = true;
    this.modalTitle = titleText || (forcedLegendaryOrDual ? '👑 擊敗頭目·傳奇黑道神賜' : '🎲 通關結算·命運三選一');
    AudioManager.playBoonCard();
    this.generateChoices(forcedLegendaryOrDual);
  }

  public close() {
    this.isOpen = false;
    this.hoveredIndex = -1;
  }

  public generateChoices(forcedLegendaryOrDual: boolean = false) {
    const run = GameState.currentRun;
    const selected: RewardCard[] = [];
    const selectedIds = new Set<string>();

    const supplyPool: RewardCard[] = [
      {
        id: 'supply_medkit',
        category: 'supply',
        name: '禁酒令私酒急救箱',
        badge: '黑市補給',
        badgeColor: '#2ecc71',
        rarity: 'supply',
        desc: '立即回復 100% 生命值，並獲得一層可抵擋任意傷害的電磁護盾。',
        data: { type: 'heal' }
      },
      {
        id: 'supply_money',
        category: 'supply',
        name: '教父洗錢黑金袋',
        badge: '黑市財富',
        badgeColor: '#ffd700',
        rarity: 'supply',
        desc: '立即獲得 $300 黑金與 2 枚免費命運重骰令。',
        data: { type: 'cash' }
      },
      {
        id: 'supply_ammo',
        category: 'supply',
        name: '重裝備用軍火箱',
        badge: '黑市軍備',
        badgeColor: '#ff9800',
        rarity: 'supply',
        desc: '主副手武器彈匣全滿，並永久提升 25% 換彈速度與射速。',
        data: { type: 'ammo' }
      },
      {
        id: 'supply_bounty',
        category: 'supply',
        name: '通緝懸賞生死令',
        badge: '通緝博弈',
        badgeColor: '#ff1744',
        rarity: 'supply',
        desc: '黑道通緝熱度 +1，立即獲得 $450 黑金與一次免費傳奇神賜機會。',
        data: { type: 'bounty' }
      }
    ];

    if (forcedLegendaryOrDual) {
      // BOSS 戰必出傳奇/雙重神賜或核心變異
      const highTierPool = BOON_DATABASE.filter(b => b.rarity === 'legendary' || b.faction === 'dual');
      const shuffled = [...highTierPool].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 3; i++) {
        const boon = shuffled[i] || BOON_DATABASE[i];
        if (boon) {
          const isOwned = run?.activeBoons.includes(boon.id);
          const lvl = (run?.boonLevels && run.boonLevels[boon.id]) || 1;
          selected.push({
            id: boon.id,
            category: 'boon',
            name: boon.name,
            badge: isOwned ? `★ 升階 Lv.${lvl + 1}` : boon.faction.toUpperCase(),
            badgeColor: '#ffd700',
            rarity: boon.rarity,
            desc: isOwned ? `【突破升階】數值大幅翻倍強化！\n${boon.desc}` : boon.desc,
            isUpgrade: isOwned,
            currentLevel: lvl,
            data: boon
          });
        }
      }
      this.choices = selected;
      return;
    }

    // 普通關卡：隨機從 4 大類別加權抽取 3 張卡牌
    for (let slot = 0; slot < 3; slot++) {
      const catRoll = Math.random();
      let pickedCard: RewardCard | null = null;

      // 1. 武器核心變異 (16% 機率，且尚未完全獲取)
      if (catRoll < 0.16) {
        const unownedMutations = WEAPON_MUTATIONS.filter(m => !run?.weaponMutations || !Object.values(run.weaponMutations).includes(m.id));
        const available = unownedMutations.filter(m => !selectedIds.has(m.id));
        if (available.length > 0) {
          const m = available[Math.floor(Math.random() * available.length)];
          pickedCard = {
            id: m.id,
            category: 'mutation',
            name: m.name,
            badge: '武器改裝',
            badgeColor: '#00e5ff',
            rarity: 'mutation',
            desc: m.desc,
            data: m
          };
        }
      }

      // 2. 浮士德血祭契約 (12% 機率，且尚未完全簽約)
      if (!pickedCard && catRoll < 0.28) {
        const unownedPacts = ALTAR_PACTS.filter(p => !run?.cursePacts || !run.cursePacts.includes(p.id));
        const available = unownedPacts.filter(p => !selectedIds.has(p.id));
        if (available.length > 0) {
          const p = available[Math.floor(Math.random() * available.length)];
          pickedCard = {
            id: p.id,
            category: 'curse',
            name: p.name,
            badge: '血祭契約',
            badgeColor: '#ff1744',
            rarity: 'curse',
            desc: `【惡魔誓約】${p.boonDesc}\n【代價】${p.curseDesc}`,
            data: p
          };
        }
      }

      // 3. 黑市軍火補給 (12% 機率)
      if (!pickedCard && catRoll < 0.40) {
        const available = supplyPool.filter(s => !selectedIds.has(s.id));
        if (available.length > 0) {
          pickedCard = available[Math.floor(Math.random() * available.length)];
        }
      }

      // 4. 黑道神賜天賦 (保底 60% 機率，支援升階突破)
      if (!pickedCard) {
        const boonPool = BOON_DATABASE.filter(b => !selectedIds.has(b.id));
        const rollRarity = Math.random();
        let targetRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
        if (rollRarity < 0.03) targetRarity = 'legendary';
        else if (rollRarity < 0.12) targetRarity = 'epic';
        else if (rollRarity < 0.38) targetRarity = 'rare';

        let subPool = boonPool.filter(b => b.rarity === targetRarity);
        if (subPool.length === 0) subPool = boonPool;
        const b = subPool[Math.floor(Math.random() * subPool.length)] || BOON_DATABASE[0];

        const isOwned = run?.activeBoons.includes(b.id);
        const lvl = (run?.boonLevels && run.boonLevels[b.id]) || 1;
        const rarityColor = b.rarity === 'legendary' ? '#ffd700' : (b.rarity === 'epic' ? '#b388ff' : (b.rarity === 'rare' ? '#64b5f6' : '#78909c'));

        pickedCard = {
          id: b.id,
          category: 'boon',
          name: b.name,
          badge: isOwned ? `★ 升階 Lv.${lvl + 1}` : b.faction.toUpperCase(),
          badgeColor: isOwned ? '#00e5ff' : rarityColor,
          rarity: b.rarity,
          desc: isOwned ? `【突破升階】效果數值大幅翻倍強化！\n${b.desc}` : b.desc,
          isUpgrade: isOwned,
          currentLevel: lvl,
          data: b
        };
      }

      if (pickedCard) {
        selected.push(pickedCard);
        selectedIds.add(pickedCard.id);
      }
    }

    this.choices = selected;
  }

  public update(): boolean {
    if (!this.isOpen) return false;

    const mx = InputManager.mouseX;
    const my = InputManager.mouseY;

    this.hoveredIndex = -1;
    if (my >= 250 && my <= 650) {
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

      // 點擊重擲按鈕 (x: 50~240, y: 690~735)
      if (mx >= 50 && mx <= 240 && my >= 690 && my <= 735) {
        this.tryReroll();
      }

      // 點擊放棄按鈕 (x: 300~490, y: 690~735)
      if (mx >= 300 && mx <= 490 && my >= 690 && my <= 735) {
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
      const card = this.choices[index];
      const run = GameState.currentRun;
      if (run) {
        if (card.category === 'boon') {
          if (!run.boonLevels) run.boonLevels = {};
          if (run.activeBoons.includes(card.id)) {
            const cur = run.boonLevels[card.id] || 1;
            run.boonLevels[card.id] = Math.min(3, cur + 1);
          } else {
            run.activeBoons.push(card.id);
            run.boonLevels[card.id] = 1;
          }
        } else if (card.category === 'mutation') {
          if (!run.weaponMutations) run.weaponMutations = {};
          run.weaponMutations[run.primaryWeaponId] = card.id;
        } else if (card.category === 'curse') {
          if (!run.cursePacts) run.cursePacts = [];
          if (!run.cursePacts.includes(card.id)) run.cursePacts.push(card.id);
        } else if (card.category === 'supply') {
          if (card.data?.type === 'heal') {
            run.hp = run.maxHp;
            if (!run.activeBoons.includes('v6')) run.activeBoons.push('v6');
          } else if (card.data?.type === 'cash') {
            run.cash += 300;
            run.rerollTokens = (run.rerollTokens || 0) + 2;
          } else if (card.data?.type === 'ammo') {
            run.primaryAmmo = 999;
            run.secondaryAmmo = 999;
          } else if (card.data?.type === 'bounty') {
            run.heatLevel = Math.min(5, (run.heatLevel || 0) + 1);
            run.cash += 450;
            const legendaryBoons = BOON_DATABASE.filter(b => b.rarity === 'legendary' && !run.activeBoons.includes(b.id));
            if (legendaryBoons.length > 0) {
              run.activeBoons.push(legendaryBoons[0].id);
            }
          }
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
      const card = this.choices[i];
      if (!card) continue;
      const startX = 26 + i * 168;
      const isHover = this.hoveredIndex === i;
      const cardY = isHover ? startY - 8 : startY;

      // 卡牌底色
      if (card.rarity === 'legendary' || card.badgeColor === '#ffd700') {
        ctx.fillStyle = isHover ? '#2a2210' : '#1d170a';
      } else if (card.rarity === 'mutation' || card.badgeColor === '#00e5ff') {
        ctx.fillStyle = isHover ? '#0f242e' : '#0a161d';
      } else if (card.rarity === 'curse' || card.badgeColor === '#ff1744') {
        ctx.fillStyle = isHover ? '#2e0f14' : '#1d0a0d';
      } else if (card.rarity === 'supply' || card.badgeColor === '#2ecc71') {
        ctx.fillStyle = isHover ? '#0f2a1b' : '#0a1a11';
      } else if (card.rarity === 'epic') {
        ctx.fillStyle = isHover ? '#22152b' : '#170f1f';
      } else if (card.rarity === 'rare') {
        ctx.fillStyle = isHover ? '#122230' : '#0d1822';
      } else {
        ctx.fillStyle = isHover ? '#1a1c24' : '#12141a';
      }
      ctx.fillRect(startX, cardY, cardW, cardH);

      const borderColor = card.badgeColor || (card.rarity === 'legendary' ? '#ffd700' : (card.rarity === 'epic' ? '#b388ff' : '#64b5f6'));
      ctx.strokeStyle = isHover ? '#ffffff' : borderColor;
      ctx.lineWidth = isHover ? 3 : 1.8;
      ctx.strokeRect(startX, cardY, cardW, cardH);

      // 光暈
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = isHover ? 16 : 8;

      // 膠囊標籤
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(startX + 12, cardY + 12, cardW - 24, 22);
      ctx.fillStyle = borderColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.badge, startX + cardW / 2, cardY + 23);

      // 卡牌名稱
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.name, startX + cardW / 2, cardY + 58);

      // 類別標籤
      const catLabel = card.category === 'mutation' ? '🧰 武器核心變異' : (card.category === 'curse' ? '🩸 惡魔雙刃契約' : (card.category === 'supply' ? '📦 黑市軍火空投' : (card.rarity === 'legendary' ? '👑 傳奇神技' : '📜 黑道神賜')));
      ctx.fillStyle = borderColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(catLabel, startX + cardW / 2, cardY + 80);

      // 分隔線
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX + 16, cardY + 94);
      ctx.lineTo(startX + cardW - 16, cardY + 94);
      ctx.stroke();

      // 卡牌效果說明
      ctx.fillStyle = '#d5d8dc';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      this.wrapText(ctx, card.desc, startX + 12, cardY + 104, cardW - 24, 15);

      // 選擇按鈕
      ctx.fillStyle = isHover ? borderColor : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(startX + 10, cardY + cardH - 44, cardW - 20, 32);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX + 10, cardY + cardH - 44, cardW - 20, 32);

      ctx.fillStyle = isHover ? '#000' : borderColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const btnText = card.isUpgrade ? `按 ${i + 1} 升至 Lv.${(card.currentLevel || 1) + 1}` : `按 ${i + 1} 選取`;
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

