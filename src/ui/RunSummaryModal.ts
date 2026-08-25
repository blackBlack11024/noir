import { RunSummary, GameState } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';

export class RunSummaryModal {
  public isOpen: boolean = false;
  public summary: RunSummary | null = null;

  public open(summary: RunSummary) {
    this.isOpen = true;
    this.summary = summary;
    if (summary.isVictory) {
      AudioManager.playBoonCard();
    } else {
      AudioManager.playHit();
    }
  }

  public close() {
    this.isOpen = false;
  }

  public update(): 'return_safehouse' | null {
    if (!this.isOpen || !this.summary) return null;

    // 空白鍵或點擊返回
    if (InputManager.isKeyJustPressed('Space') || InputManager.isKeyJustPressed('Enter')) {
      this.close();
      return 'return_safehouse';
    }

    if (InputManager.isLmbJustPressed) {
      const mx = InputManager.mouseX;
      const my = InputManager.mouseY;
      // 點擊確認按鈕 (x: 120~420, y: 790~860)
      if (mx >= 120 && mx <= 420 && my >= 790 && my <= 860) {
        this.close();
        AudioManager.playSlash();
        return 'return_safehouse';
      }
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isOpen || !this.summary) return;

    ctx.save();
    // 暗黑深邃背景遮罩
    ctx.fillStyle = 'rgba(10, 11, 15, 0.94)';
    ctx.fillRect(0, 0, 540, 960);

    // 主結算憑證卡片
    const bx = 30;
    const by = 70;
    const bw = 480;
    const bh = 820;

    ctx.fillStyle = '#14161f';
    ctx.fillRect(bx, by, bw, bh);

    ctx.strokeStyle = this.summary.isVictory ? '#ffd700' : '#b22222';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bx, by, bw, bh);

    // 內部裝飾金線 (Art Deco Corner Accents)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 8, by + 8, bw - 16, bh - 16);

    // 標題
    ctx.fillStyle = this.summary.isVictory ? '#ffd700' : '#ff4500';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.summary.isVictory ? '黑幫霸主 徹底清算' : '喋血街頭 遺恨隕落', 270, by + 48);

    ctx.fillStyle = '#888888';
    ctx.font = '12px sans-serif';
    ctx.fillText('LE MILIEU: NOIR RUN RECAP', 270, by + 72);

    // 戰鬥評級大徽章 (Style Rank SSS / S / A / B)
    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.beginPath();
    ctx.arc(270, by + 155, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 40px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.summary.styleRank, 270, by + 155);

    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.fillText('作戰風格評級', 270, by + 225);

    // 數據統計網格
    const renderStatRow = (y: number, label: string, val: string, color: string = '#fff') => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(bx + 25, y, bw - 50, 36);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.strokeRect(bx + 25, y, bw - 50, 36);

      ctx.fillStyle = '#bbb';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, bx + 40, y + 23);

      ctx.fillStyle = color;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, bx + bw - 40, y + 23);
    };

    const depthText = (this.summary.loopCount && this.summary.loopCount > 1 ? `[輪迴 ${this.summary.loopCount}] ` : '') + '區域 ' + this.summary.zone + ' (已清房 ' + this.summary.roomsCleared + ')';
    renderStatRow(by + 250, '最高突破深度', depthText, '#ffd700');
    renderStatRow(by + 295, '擊殺黑幫勢力', this.summary.kills + ' 人', '#ff5252');
    renderStatRow(by + 340, '本次黑金收益', '$ ' + this.summary.cashEarned + ' (全數繼承)', '#2ecc71');
    renderStatRow(by + 385, '造成總傷害量', this.summary.damageDealt.toString(), '#00e5ff');
    renderStatRow(by + 430, '本次清算時長', Math.floor(this.summary.durationSeconds / 60) + ' 分 ' + (this.summary.durationSeconds % 60) + ' 秒', '#ffffff');

    // 首殺新神兵解鎖橫幅
    if (this.summary.unlockedWeaponName) {
      ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
      ctx.fillRect(bx + 25, by + 485, bw - 50, 48);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 25, by + 485, bw - 50, 48);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('首殺頭目解鎖新神兵入庫', 270, by + 504);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(this.summary.unlockedWeaponName, 270, by + 524);
    }

    // 累積黑金提示
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('夜鶯金庫總資產: $ ' + GameState.totalCash, 270, by + 680);

    // 返回按鈕
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(120, by + 720, 300, 52);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, by + 720, 300, 52);

    ctx.fillStyle = '#0f1115';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('返回安全屋酒吧 (空白鍵)', 270, by + 752);

    ctx.restore();
  }
}
