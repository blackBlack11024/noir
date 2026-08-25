import { InputManager } from '../core/InputManager';

export class TouchControls {
  public render(ctx: CanvasRenderingContext2D) {
    if (!InputManager.isTouchDevice) return;

    ctx.save();

    // 1. 動態浮動搖桿
    if (InputManager.joystickActive) {
      const ox = InputManager.joystickOriginX;
      const oy = InputManager.joystickOriginY;
      const cx = InputManager.joystickCurrentX;
      const cy = InputManager.joystickCurrentY;

      // 底盤
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = 'rgba(20, 22, 28, 0.7)';
      ctx.beginPath();
      ctx.arc(ox, oy, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 搖桿中心指針 (Knob)
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // 待命時的極簡手勢提示
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#ffd700';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('滑動移動蓄力  |  劃過衝刺  |  雙擊特技', 270, 930);
    }

    ctx.restore();
  }
}

