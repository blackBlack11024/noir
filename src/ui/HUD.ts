import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { GameState } from '../core/GameState';
import { InputManager } from '../core/InputManager';

export class HUD {
  public render(ctx: CanvasRenderingContext2D, player: Player, boss: Boss | null, styleRank: string = 'D', comboCount: number = 0, currentWave: number = 1, totalWaves: number = 1) {
    // 1. 瀕死暗角紅光警示 (Low-HP Vignette)
    if (player.hp < player.maxHp * 0.35) {
      ctx.save();
      const pulse = 0.35 + Math.sin(Date.now() / 150) * 0.2;
      const grad = ctx.createRadialGradient(270, 480, 200, 270, 480, 480);
      grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
      grad.addColorStop(1, `rgba(180, 0, 0, ${pulse})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 540, 960);
      ctx.restore();
    }

    // SSS (JACKPOT!) 狂熱全屏金光霓虹流彩邊框
    if (styleRank === 'SSS') {
      ctx.save();
      const pulse = 0.5 + Math.sin(Date.now() / 120) * 0.3;
      ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 534, 954);
      ctx.restore();
    }

    // 2. 頂部極簡狀態列 (高 36px)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 17, 21, 0.9)';
    ctx.fillRect(0, 0, 540, 36);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 540, 36);

    // 生命值 (懷錶條)
    const hpPct = Math.max(0, player.hp / player.maxHp);
    const isLowHp = hpPct < 0.35;

    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(14, 8, 125, 18);

    ctx.fillStyle = isLowHp ? '#ff1744' : '#b22222';
    ctx.fillRect(14, 8, 125 * hpPct, 18);

    ctx.strokeStyle = isLowHp ? '#ff5252' : '#d4af37';
    ctx.lineWidth = isLowHp ? 2 : 1;
    ctx.strokeRect(14, 8, 125, 18);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HP ' + Math.ceil(player.hp) + '/' + player.maxHp, 20, 21);

    // 翻滾精力點
    for (let i = 0; i < player.maxStamina; i++) {
      ctx.fillStyle = i < player.stamina ? '#ffd700' : '#444';
      ctx.beginPath();
      ctx.arc(156 + i * 14, 17, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }

    // 房間進度與波次梯隊 (展示波次階梯)
    if (GameState.currentRun) {
      ctx.fillStyle = GameState.currentRun.loopCount > 1 ? '#ff7043' : '#d4af37';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const loopText = GameState.currentRun.loopCount > 1 ? ` [輪迴 ${GameState.currentRun.loopCount}]` : '';
      const waveText = boss ? ' [頭目決戰]' : ` (波次 ${currentWave}/${totalWaves})`;
      ctx.fillText(`區域 ${GameState.currentRun.zone} - 房 ${GameState.currentRun.roomIndex}/4${waveText}${loopText}`, 250, 22);
    }

    // 黑金鈔票
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    const cashText = '$ ' + (GameState.currentRun ? GameState.currentRun.cash : GameState.totalCash);
    ctx.fillText(cashText, 410, 22);

    // Style Meter 連擊評價徽章 (右上角)
    const rankColors: Record<string, string> = {
      D: '#7f8c8d',
      C: '#3498db',
      B: '#2ecc71',
      A: '#f1c40f',
      S: '#e67e22',
      SSS: '#ff1744'
    };
    const rColor = rankColors[styleRank] || '#7f8c8d';

    ctx.fillStyle = rColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(styleRank, 442, 23);

    // 頂部暫停按鈕
    ctx.fillStyle = '#2a2e3d';
    ctx.fillRect(468, 7, 62, 22);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(468, 7, 62, 22);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暫停', 499, 22);
    ctx.restore();

    // 懸浮連擊指示 (Combo Counter) 與 通緝熱度指示 (Heat Gauge)
    ctx.save();
    const heat = GameState.currentRun?.heatLevel || 0;
    if (heat > 0) {
      const heatColors = ['', '#ffd54f', '#ff9800', '#ff5722', '#f44336', '#d50000'];
      ctx.fillStyle = heatColors[heat] || '#ff1744';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🔥 通緝熱度 Lv.${heat}`, 14, 52);
    }

    const passport = GameState.currentRun?.passport;
    if (passport && passport !== 'default') {
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 10.5px sans-serif';
      ctx.textAlign = 'left';
      const pNames: Record<string, string> = {
        hitman: '🕶️ 冷血殺手',
        bootlegger: '🍸 私酒大亨',
        high_roller: '🎰 亡命賭徒',
        brawler: '🥊 地下拳王',
        cyber_tinkerer: '🤖 機械狂徒'
      };
      ctx.fillText(`🪪 ${pNames[passport] || passport}`, 115, 52);
    }

    if (comboCount >= 2) {
      ctx.fillStyle = rColor;
      ctx.font = 'bold italic 18px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${comboCount} HITS!`, 525, 60);
    }
    ctx.restore();

    // 3. Boss 頂部雙層血條
    if (boss && !boss.isDead) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(50, 44, 440, 24);
      ctx.strokeStyle = boss.isEnraged ? '#ff1744' : '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(50, 44, 440, 24);

      // 護甲條 (藍色)
      if (boss.maxArmor > 0 && boss.armor > 0) {
        ctx.fillStyle = '#4682b4';
        ctx.fillRect(52, 46, 436 * (boss.armor / boss.maxArmor), 10);
      }

      // 生命條 (紅色)
      ctx.fillStyle = boss.isEnraged ? '#ff1744' : '#b22222';
      ctx.fillRect(52, 57, 436 * Math.max(0, boss.hp / boss.maxHp), 9);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((boss.isEnraged ? '【狂暴】' : '') + boss.info.title + ' ' + boss.info.name, 270, 40);
      ctx.restore();
    }

    // 4. 底部懸浮極簡雙武器槽 (高 24px)
    ctx.save();
    const curW = player.getCurrentWeapon();
    const ammoText = curW.maxAmmo > 0 ? player.getAmmo() + '/' + curW.maxAmmo : '近戰';
    const slotLabel = player.currentSlot === 0 ? '主: ' : '副: ';
    const hasDualWeapons = player.primaryWeaponId !== player.secondaryWeaponId;
    
    ctx.fillStyle = 'rgba(18, 20, 26, 0.85)';
    ctx.fillRect(10, 926, 260, 26);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.strokeRect(10, 926, 260, 26);

    ctx.fillStyle = curW.color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(slotLabel + curW.name + ' [' + ammoText + ']', 16, 943);

    ctx.fillStyle = '#888';
    if (hasDualWeapons) {
      ctx.fillText('Q切換', 215, 943);
    } else {
      ctx.fillText('單持', 225, 943);
    }

    // 專屬被動與特技
    ctx.fillStyle = 'rgba(18, 20, 26, 0.85)';
    ctx.fillRect(276, 926, 254, 26);
    ctx.strokeStyle = player.skillCooldownTimer <= 0 ? '#ffd700' : '#444';
    ctx.strokeRect(276, 926, 254, 26);

    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('◆' + curW.passiveName, 282, 942);

    ctx.fillStyle = player.skillCooldownTimer <= 0 ? '#ffd700' : '#888';
    ctx.textAlign = 'right';
    ctx.fillText(player.skillCooldownTimer <= 0 ? '特技:就緒[E]' : 'CD ' + player.skillCooldownTimer.toFixed(1) + 's', 522, 942);

    // 雞尾酒 Buff 標籤 (若有飲用)
    const cocktail = GameState.currentRun?.selectedCocktail;
    if (cocktail) {
      const names: Record<string, string> = {
        absinthe: '[特調] 苦艾酒 (閃避+0.15s)',
        bloody_mary: '[特調] 血腥瑪麗 (殺敵吸血)',
        godfather: '[特調] 教父特調 (增傷+20%)',
        cryo_gin: '[特調] 乾冰琴酒 (極寒減速)'
      };
      ctx.fillStyle = 'rgba(18, 20, 26, 0.8)';
      ctx.fillRect(10, 896, 170, 22);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 896, 170, 22);

      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(names[cocktail] || '[特調] 雞尾酒', 16, 911);
    }

    ctx.restore();

    // 5. 準星與一體化彈藥/近戰連招光點
    this.renderReticle(ctx, player);
  }

  private renderReticle(ctx: CanvasRenderingContext2D, player: Player) {
    const mx = InputManager.mouseX;
    const my = InputManager.mouseY;
    const curW = player.getCurrentWeapon();
    const isMelee = (curW.category === 'melee' || (curW.category === 'heavy' && curW.maxAmmo === 0));

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;

    // 十字準星
    ctx.beginPath();
    ctx.moveTo(mx - 8, my);
    ctx.lineTo(mx + 8, my);
    ctx.moveTo(mx, my - 8);
    ctx.lineTo(mx, my + 8);
    ctx.stroke();

    if (isMelee) {
      // 近戰 3 段連招段數指示器 (3 個弧形小圓點)
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const px = mx + Math.cos(a) * 16;
        const py = my + Math.sin(a) * 16;
        ctx.fillStyle = i <= player.meleeComboStep ? curW.color : 'rgba(80, 80, 80, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (curW.maxAmmo > 0) {
      // 槍械彈藥小點
      const ammo = player.getAmmo();
      const max = Math.min(12, curW.maxAmmo);
      for (let i = 0; i < max; i++) {
        const a = (i / max) * Math.PI * 2;
        const px = mx + Math.cos(a) * 16;
        const py = my + Math.sin(a) * 16;
        ctx.fillStyle = i < ammo ? '#ffd700' : 'rgba(80, 80, 80, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

