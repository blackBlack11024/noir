import { GameState } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { BOON_DATABASE, BoonInfo } from '../data/BoonDatabase';

export class PauseModal {
  public isOpen: boolean = false;
  private boonMap: Map<string, BoonInfo> = new Map();

  constructor() {
    for (const b of BOON_DATABASE) {
      this.boonMap.set(b.id, b);
    }
  }

  public open() {
    this.isOpen = true;
    AudioManager.playBoonCard();
  }

  public close() {
    this.isOpen = false;
  }

  public update(): 'resume' | 'retire' | null {
    if (!this.isOpen) return null;

    // Esc / P / Space 鍵繼續戰鬥
    if (InputManager.isKeyJustPressed('Escape') || InputManager.isKeyJustPressed('KeyP') || InputManager.isKeyJustPressed('Space')) {
      this.close();
      return 'resume';
    }

    if (InputManager.isLmbJustPressed) {
      const mx = InputManager.mouseX;
      const my = InputManager.mouseY;

      // 點擊【繼續戰鬥】 (x: 50~240, y: 840~895)
      if (mx >= 50 && mx <= 240 && my >= 840 && my <= 895) {
        this.close();
        AudioManager.playSlash();
        return 'resume';
      }

      // 點擊【滿載提款 返回安全屋】 (x: 290~480, y: 840~895)
      if (mx >= 290 && mx <= 480 && my >= 840 && my <= 895) {
        this.close();
        AudioManager.playCash();
        return 'retire';
      }
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isOpen) return;

    const run = GameState.currentRun;
    if (!run) return;

    ctx.save();
    // 半透明深邃黑金背景
    ctx.fillStyle = 'rgba(10, 12, 16, 0.95)';
    ctx.fillRect(0, 0, 540, 960);

    const bx = 30;
    const by = 55;
    const bw = 480;
    const bh = 855;

    ctx.fillStyle = '#14161f';
    ctx.fillRect(bx, by, bw, bh);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // 內邊框金線
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);

    // 標題
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('戰鬥暫停', 270, by + 36);

    ctx.fillStyle = '#888888';
    ctx.font = '11px sans-serif';
    const loopTxt = run.loopCount > 1 ? ` [黑金輪迴 第 ${run.loopCount} 輪]` : '';
    ctx.fillText(`清算進行中 | 區域 ${run.zone} - 房 ${run.roomIndex}/4${loopTxt}`, 270, by + 58);

    // 局內即時戰況條
    const duration = Math.floor((performance.now() - run.startTime) / 1000);
    const min = Math.floor(duration / 60);
    const sec = duration % 60;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(bx + 18, by + 76, bw - 36, 42);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.strokeRect(bx + 18, by + 76, bw - 36, 42);

    ctx.fillStyle = '#eee';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`擊殺: ${run.kills} 人`, bx + 30, by + 98);
    ctx.fillText(`傷害: ${Math.round(run.damageDealt)}`, bx + 130, by + 98);

    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`黑金: $${run.cash}`, bx + 245, by + 98);

    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`時長: ${min}分${sec}秒`, bx + bw - 30, by + 98);

    // 已獲得罪惡天賦背包標題
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`已生效罪惡天賦牌組 (${run.activeBoons.length} 項):`, bx + 20, by + 142);

    // 天賦卡片展示列表 (可視區域 y: by + 155 ~ by + 750)
    const activeBoons = run.activeBoons.map(id => this.boonMap.get(id)).filter(Boolean) as BoonInfo[];

    if (activeBoons.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = 'italic 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('尚未獲得天賦祝福 (清空房間後可於黑金塔羅牌中挑選)', 270, by + 260);
    } else {
      const cardStartY = by + 160;
      const cardHeight = 60;
      const cardGap = 8;
      const maxDisplay = 9;

      for (let i = 0; i < Math.min(activeBoons.length, maxDisplay); i++) {
        const b = activeBoons[i];
        const cy = cardStartY + i * (cardHeight + cardGap);

        ctx.fillStyle = 'rgba(20, 24, 32, 0.85)';
        ctx.fillRect(bx + 18, cy, bw - 36, cardHeight);

        const rarityColor = b.rarity === 'legendary' ? '#ffd700' : (b.rarity === 'epic' ? '#b388ff' : (b.rarity === 'rare' ? '#64b5f6' : '#9e9e9e'));
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = b.rarity === 'legendary' ? 2 : 1;
        ctx.strokeRect(bx + 18, cy, bw - 36, cardHeight);

        // 派系與稀有度小徽章
        ctx.fillStyle = rarityColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`[${b.faction.toUpperCase()}] ${b.name}`, bx + 28, cy + 18);

        const rarityName = b.rarity === 'legendary' ? '★ 傳奇' : (b.rarity === 'epic' ? '◆ 史詩' : (b.rarity === 'rare' ? '▲ 稀有' : '● 普通'));
        ctx.textAlign = 'right';
        ctx.fillText(rarityName, bx + bw - 28, cy + 18);

        // 天賦說明文字
        ctx.fillStyle = '#bbb';
        ctx.font = '10.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(b.desc, bx + 28, cy + 38);
      }

      if (activeBoons.length > maxDisplay) {
        ctx.fillStyle = '#888';
        ctx.font = 'italic 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`...以及其餘 ${activeBoons.length - maxDisplay} 項已生效天賦`, 270, by + 750);
      }
    }

    // 底部按鈕
    // 1. 繼續戰鬥
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(50, 840, 190, 52);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(50, 840, 190, 52);

    ctx.fillStyle = '#0f1115';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('繼續戰鬥 (Esc)', 145, 866);

    // 2. 滿載提款返回安全屋
    ctx.fillStyle = '#1c1f2b';
    ctx.fillRect(290, 840, 200, 52);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(290, 840, 200, 52);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('提款返航 (結算)', 390, 866);

    ctx.restore();
  }
}
