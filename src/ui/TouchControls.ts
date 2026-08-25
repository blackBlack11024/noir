import { InputManager } from '../core/InputManager';

export class TouchControls {
  public render(ctx: CanvasRenderingContext2D) {
    if (!InputManager.isTouchDevice) return;

    ctx.save();

    // 1. 左側動態浮動搖桿
    if (InputManager.joystickActive) {
      const ox = InputManager.joystickOriginX;
      const oy = InputManager.joystickOriginY;
      const cx = InputManager.joystickCurrentX;
      const cy = InputManager.joystickCurrentY;

      // 底盤
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = 'rgba(20, 22, 28, 0.7)';
      ctx.beginPath();
      ctx.arc(ox, oy, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 搖桿中心指針 (Knob)
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
    // 待命時的微弱提示
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(100, 760, 52, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#d4af37';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('滑動走位', 100, 764);
    }

    // 2. 右側動作按鈕群
    const renderButton = (x: number, y: number, r: number, text: string, sub: string, isDown: boolean, color: string = '#ffd700') => {
      ctx.save();
      ctx.globalAlpha = isDown ? 0.9 : 0.6;

      // 按鈕底色
      ctx.fillStyle = isDown ? 'rgba(212, 175, 55, 0.45)' : 'rgba(15, 17, 22, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // 外邊框
      ctx.strokeStyle = isDown ? '#ffffff' : color;
      ctx.lineWidth = isDown ? 3 : 2;
      ctx.stroke();

      // 主文字
      ctx.fillStyle = isDown ? '#ffffff' : '#e5dfd3';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, sub ? y - 5 : y);

      // 副文字 (冷卻/按鍵)
      if (sub) {
        ctx.fillStyle = color;
        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillText(sub, x, y + 9);
      }

      ctx.restore();
    };

    renderButton(440, 780, 42, '攻擊', '', InputManager.touchAttack, '#ffd700');
    renderButton(348, 805, 34, '重攻', '蓄力', InputManager.touchCharge, '#ff9800');
    renderButton(450, 670, 34, '翻滾', '', InputManager.touchDodge, '#00bfff');
    renderButton(360, 705, 32, '特技', 'E', InputManager.touchSkill, '#e040fb');
    renderButton(455, 565, 30, '切槍', 'Q', InputManager.touchSwap, '#76ff03');
    renderButton(370, 605, 30, '換彈', 'R', InputManager.touchReload, '#ff5252');

    ctx.restore();
  }
}

