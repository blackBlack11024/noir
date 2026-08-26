import { GameState } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { Player } from '../entities/Player';

export interface WeaponMutation {
  id: string;
  name: string;
  type: string;
  desc: string;
  color: string;
}

export const WEAPON_MUTATIONS: WeaponMutation[] = [
  {
    id: 'mutation_mark',
    name: '【六發裁決·連鎖殉爆】',
    type: '彈道印記核心',
    desc: '前 5 發子彈命中在敵人身上留下死之印記，第 6 發命中時引爆全場所有印記造成 300 點連環大殉爆！',
    color: '#ffd700'
  },
  {
    id: 'mutation_singularity',
    name: '【重力引力·微型黑洞】',
    type: '時空聚怪核心',
    desc: '開火發射一顆微型引力奇異點黑洞，強力吸附周圍 220px 內所有敵怪與敵方子彈並在中心引爆！',
    color: '#00e5ff'
  },
  {
    id: 'mutation_iai',
    name: '【居合拔刀·時空次元斬】',
    type: '近戰瞬步核心',
    desc: '蓄力鬆開時主角向前超光速瞬移 180px 斬斷軌跡上所有子彈，並對沿途所有敵人附加 3 段時空割裂！',
    color: '#ff1744'
  }
];

export class GunsmithModal {
  public isOpen: boolean = false;
  public hoveredIndex: number = -1;

  public open() {
    this.isOpen = true;
    AudioManager.playReload();
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
    for (let i = 0; i < 3; i++) {
      const top = 250 + i * 145;
      if (mx >= 35 && mx <= 505 && my >= top && my <= top + 130) {
        this.hoveredIndex = i;
        break;
      }
    }

    const isLeaveHovered = mx >= 160 && mx <= 380 && my >= 710 && my <= 755;

    if (InputManager.isKeyJustPressed('Digit1') || InputManager.isKeyJustPressed('Numpad1')) {
      this.applyMutation(0, player);
      return true;
    }
    if (InputManager.isKeyJustPressed('Digit2') || InputManager.isKeyJustPressed('Numpad2')) {
      this.applyMutation(1, player);
      return true;
    }
    if (InputManager.isKeyJustPressed('Digit3') || InputManager.isKeyJustPressed('Numpad3')) {
      this.applyMutation(2, player);
      return true;
    }
    if (InputManager.isKeyJustPressed('Space') || InputManager.isKeyJustPressed('Escape')) {
      this.close();
      return true;
    }

    if (InputManager.isLmbJustPressed) {
      if (this.hoveredIndex >= 0) {
        this.applyMutation(this.hoveredIndex, player);
        return true;
      } else if (isLeaveHovered) {
        this.close();
        return true;
      }
    }

    return false;
  }

  private applyMutation(index: number, player: Player) {
    if (!GameState.currentRun || index < 0 || index >= WEAPON_MUTATIONS.length) return;
    const mutation = WEAPON_MUTATIONS[index];
    const curW = player.getCurrentWeapon();

    if (!GameState.currentRun.weaponMutations) GameState.currentRun.weaponMutations = {};
    GameState.currentRun.weaponMutations[curW.id] = mutation.id;

    AudioManager.playCritHit();
    InputManager.haptic([40, 90]);
    this.close();
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isOpen) return;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 16, 0.95)';
    ctx.fillRect(0, 0, 540, 960);

    // 標題
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧰 軍火黑市武器改裝台 🧰', 270, 180);

    ctx.fillStyle = '#b0bec5';
    ctx.font = '12px sans-serif';
    ctx.fillText('為當前武器加裝核心機制變異模組：徹底顛覆攻擊形態！', 270, 210);

    for (let i = 0; i < 3; i++) {
      const mut = WEAPON_MUTATIONS[i];
      const top = 250 + i * 145;
      const isHover = this.hoveredIndex === i;

      ctx.fillStyle = isHover ? '#102a43' : '#0a1926';
      ctx.fillRect(35, top, 470, 130);

      ctx.strokeStyle = isHover ? '#ffffff' : mut.color;
      ctx.lineWidth = isHover ? 2.5 : 1.5;
      ctx.strokeRect(35, top, 470, 130);

      // 模組標題
      ctx.fillStyle = mut.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${mut.name}  [${mut.type}]`, 50, top + 24);

      // 效果說明
      ctx.fillStyle = '#e0f7fa';
      ctx.font = '12px sans-serif';
      this.wrapText(ctx, `⚙️ 改造效果：${mut.desc}`, 50, top + 48, 440, 18);

      // 選取提示按鈕
      ctx.fillStyle = isHover ? '#00e5ff' : '#888888';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`按 [${i + 1}] 裝載此模組`, 490, top + 112);
    }

    // 離開按鈕
    ctx.fillStyle = '#1c1f2b';
    ctx.fillRect(160, 710, 220, 45);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(160, 710, 220, 45);

    ctx.fillStyle = '#cccccc';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('保留原狀 離開 [Space]', 270, 732);

    ctx.restore();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const chars = text.split('');
    let line = '';
    let currentY = y;
    for (let n = 0; n < chars.length; n++) {
      const testLine = line + chars[n];
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
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
