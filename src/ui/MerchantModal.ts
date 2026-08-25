import { GameState } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { Player } from '../entities/Player';

export class MerchantModal {
  public isOpen: boolean = false;
  public hoveredIndex: number = -1;
  public message: string = '歡迎來到禁酒令地下黑市。只要有黑金，什麼都能買到。';
  public messageColor: string = '#d4af37';

  public open() {
    this.isOpen = true;
    AudioManager.playCash();
    this.message = '歡迎來到禁酒令地下黑市。只要有黑金，什麼都能買到。';
    this.messageColor = '#d4af37';
  }

  public close() {
    this.isOpen = false;
    this.hoveredIndex = -1;
  }

  public update(player: Player): boolean {
    if (!this.isOpen) return false;

    const mx = InputManager.mouseX;
    const my = InputManager.mouseY;

    this.hoveredIndex = -1;
    // 4 個商品欄位
    for (let i = 0; i < 4; i++) {
      const top = 260 + i * 95;
      if (mx >= 35 && mx <= 505 && my >= top && my <= top + 80) {
        this.hoveredIndex = i;
        break;
      }
    }

    const isExitHovered = mx >= 140 && mx <= 400 && my >= 670 && my <= 720;

    // 快捷鍵 1, 2, 3, 4 購買，Space 或 Escape 離開
    if (InputManager.isKeyJustPressed('Digit1') || InputManager.isKeyJustPressed('Numpad1')) {
      this.buyItem(0, player);
    } else if (InputManager.isKeyJustPressed('Digit2') || InputManager.isKeyJustPressed('Numpad2')) {
      this.buyItem(1, player);
    } else if (InputManager.isKeyJustPressed('Digit3') || InputManager.isKeyJustPressed('Numpad3')) {
      this.buyItem(2, player);
    } else if (InputManager.isKeyJustPressed('Digit4') || InputManager.isKeyJustPressed('Numpad4')) {
      this.buyItem(3, player);
    } else if (InputManager.isKeyJustPressed('Space') || InputManager.isKeyJustPressed('Escape')) {
      this.close();
      return true;
    }

    if (InputManager.isLmbJustPressed) {
      if (this.hoveredIndex >= 0) {
        this.buyItem(this.hoveredIndex, player);
      } else if (isExitHovered) {
        this.close();
        return true;
      }
    }

    return false;
  }

  private buyItem(index: number, player: Player) {
    if (!GameState.currentRun) return;
    const cash = GameState.currentRun.cash;

    if (index === 0) {
      // 1. 私酒急救補給包 ($60, +45 HP)
      const cost = 60;
      if (cash >= cost) {
        GameState.addCash(-cost);
        player.hp = Math.min(player.maxHp, player.hp + 45);
        GameState.currentRun.hp = player.hp;
        AudioManager.playCash();
        this.message = '私酒急救包生效，生命值回復45點。';
        this.messageColor = '#2ecc71';
      } else {
        AudioManager.playHit();
        this.message = '黑金不足，無法購買私酒急救包。';
        this.messageColor = '#ff5252';
      }
    } else if (index === 1) {
      // 2. 黑市重型彈藥箱 ($40, 補滿彈藥與精力)
      const cost = 40;
      if (cash >= cost) {
        GameState.addCash(-cost);
        player.primaryAmmo = player.getCurrentWeapon().maxAmmo || 6;
        player.secondaryAmmo = player.getCurrentWeapon().maxAmmo || 6;
        player.stamina = player.maxStamina;
        AudioManager.playReload();
        this.message = '軍規彈藥補充完畢，全彈藥與精力已補滿。';
        this.messageColor = '#ffd700';
      } else {
        AudioManager.playHit();
        this.message = '黑金不足，無法購買彈藥箱。';
        this.messageColor = '#ff5252';
      }
    } else if (index === 2) {
      // 3. 俄羅斯輪盤博弈 ($50, 70% 得 $150, 30% 扣 15 HP)
      const cost = 50;
      if (cash >= cost) {
        GameState.addCash(-cost);
        if (Math.random() < 0.7) {
          GameState.addCash(150);
          AudioManager.playCash();
          this.message = '賭局獲勝，贏得150黑金獎勵。';
          this.messageColor = '#ffd700';
        } else {
          player.hp = Math.max(1, player.hp - 15);
          GameState.currentRun.hp = player.hp;
          AudioManager.playHit();
          this.message = '空膛走火，受到15點傷害。';
          this.messageColor = '#ff3333';
        }
      } else {
        AudioManager.playHit();
        this.message = '黑金不足50元，無法參與賭局。';
        this.messageColor = '#ff5252';
      }
    } else if (index === 3) {
      // 4. 重型防彈插板 ($75, +20 HP上限與1次護盾)
      const cost = 75;
      if (cash >= cost) {
        GameState.addCash(-cost);
        player.maxHp += 20;
        player.hp = Math.min(player.maxHp, player.hp + 20);
        player.hasShield = true;
        GameState.currentRun.maxHp = player.maxHp;
        GameState.currentRun.hp = player.hp;
        AudioManager.playCash();
        this.message = '裝備重型防彈插板，生命上限增加20點並獲得免傷護盾。';
        this.messageColor = '#3498db';
      } else {
        AudioManager.playHit();
        this.message = '黑金不足，無法購買防彈插板。';
        this.messageColor = '#ff5252';
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isOpen) return;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 16, 0.94)';
    ctx.fillRect(0, 0, 540, 960);

    // 金色奢華外框
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 50, 504, 860);

    // 標題區域
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('禁酒令地下黑市商人', 270, 95);

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('SPEAKEASY BLACK MARKET', 270, 118);

    // 商人對話框
    ctx.fillStyle = 'rgba(25, 28, 36, 0.9)';
    ctx.fillRect(35, 140, 470, 90);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(35, 140, 470, 90);

    ctx.fillStyle = this.messageColor;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.message, 270, 190);

    // 持有黑金餘額
    const cash = GameState.currentRun ? GameState.currentRun.cash : 0;
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('持有黑金: $' + cash, 490, 250);

    // 4 個商品卡片
    const items = [
      { num: '1', name: '私酒急救補給包', desc: '立即恢復 45 點生命值', price: '$60', color: '#2ecc71' },
      { num: '2', name: '黑市重型彈藥箱', desc: '補滿主副武器彈藥與所有精力', price: '$40', color: '#ffd700' },
      { num: '3', name: '俄羅斯輪盤博弈', desc: '70% 機率贏取 $150，30% 受到 15 傷害', price: '$50', color: '#ff7043' },
      { num: '4', name: '重型防彈插板', desc: '生命上限提升 20 點並獲得 1 次免傷護盾', price: '$75', color: '#3498db' }
    ];

    for (let i = 0; i < 4; i++) {
      const it = items[i];
      const top = 260 + i * 95;
      const isHov = this.hoveredIndex === i;

      ctx.fillStyle = isHov ? 'rgba(40, 45, 58, 0.95)' : 'rgba(20, 22, 28, 0.85)';
      ctx.fillRect(35, top, 470, 80);

      ctx.strokeStyle = isHov ? it.color : 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = isHov ? 2.5 : 1;
      ctx.strokeRect(35, top, 470, 80);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`[${it.num}] ${it.name}`, 55, top + 34);

      ctx.fillStyle = '#aaa';
      ctx.font = '12px sans-serif';
      ctx.fillText(it.desc, 55, top + 58);

      // 價格標籤
      ctx.fillStyle = it.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(it.price, 485, top + 46);
    }

    // 離開按鈕
    const isExitHov = InputManager.mouseX >= 140 && InputManager.mouseX <= 400 && InputManager.mouseY >= 670 && InputManager.mouseY <= 720;
    ctx.fillStyle = isExitHov ? '#d4af37' : '#1c1f26';
    ctx.fillRect(140, 670, 260, 50);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(140, 670, 260, 50);

    ctx.fillStyle = isExitHov ? '#000' : '#ffd700';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('離開黑市 (繼續前進) [Space]', 270, 701);

    ctx.restore();
  }
}
