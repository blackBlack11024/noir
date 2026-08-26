import { GameState } from '../core/GameState';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { Player } from '../entities/Player';

export interface AltarPact {
  id: string;
  name: string;
  subtitle: string;
  boonDesc: string;
  curseDesc: string;
  color: string;
}

export const ALTAR_PACTS: AltarPact[] = [
  {
    id: 'pact_flesh',
    name: '【血肉換子彈】',
    subtitle: '極限嗜血狂徒契約',
    boonDesc: '全武器彈匣容量無限，且所有遠程與近戰傷害提升 250%！',
    curseDesc: '每射出 4 發子彈扣除 1 點生命值；無法透過常規藥包回血，唯有近戰處決敵人可吸血。',
    color: '#ff1744'
  },
  {
    id: 'pact_glass',
    name: '【玻璃大砲·黑天鵝】',
    subtitle: '極限致命暴擊契約',
    boonDesc: '所有攻擊暴擊率固定 100%，暴擊傷害倍率提升至 400% 毀滅級！',
    curseDesc: '最大生命值上限強制鎖定為 70 點；受到任何傷害時直接扣除 35% 當前生命。',
    color: '#e040fb'
  },
  {
    id: 'pact_midas',
    name: '【受詛咒的邁達斯黃金】',
    subtitle: '黑金貪婪奴隸契約',
    boonDesc: '黑金掉落量翻 4 倍；身上持有的每一枚黑金額外提供 +0.4% 全傷害加成！',
    curseDesc: '受傷時損失 15% 當前持有的黑金；若黑金歸零，每秒扣除 5 點生命值！',
    color: '#ffd700'
  }
];

export class AltarModal {
  public isOpen: boolean = false;
  public hoveredIndex: number = -1;

  public open() {
    this.isOpen = true;
    AudioManager.playSlash();
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
      this.signPact(0, player);
      return true;
    }
    if (InputManager.isKeyJustPressed('Digit2') || InputManager.isKeyJustPressed('Numpad2')) {
      this.signPact(1, player);
      return true;
    }
    if (InputManager.isKeyJustPressed('Digit3') || InputManager.isKeyJustPressed('Numpad3')) {
      this.signPact(2, player);
      return true;
    }
    if (InputManager.isKeyJustPressed('Space') || InputManager.isKeyJustPressed('Escape')) {
      this.close();
      return true;
    }

    if (InputManager.isLmbJustPressed) {
      if (this.hoveredIndex >= 0) {
        this.signPact(this.hoveredIndex, player);
        return true;
      } else if (isLeaveHovered) {
        this.close();
        return true;
      }
    }

    return false;
  }

  private signPact(index: number, player: Player) {
    if (!GameState.currentRun || index < 0 || index >= ALTAR_PACTS.length) return;
    const pact = ALTAR_PACTS[index];

    if (!GameState.currentRun.cursePacts) GameState.currentRun.cursePacts = [];
    if (!GameState.currentRun.cursePacts.includes(pact.id)) {
      GameState.currentRun.cursePacts.push(pact.id);
    }

    if (pact.id === 'pact_glass') {
      player.maxHp = 70;
      player.hp = Math.min(player.hp, 70);
    }

    AudioManager.playExplosion();
    InputManager.haptic([50, 100]);
    this.close();
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isOpen) return;

    ctx.save();
    ctx.fillStyle = 'rgba(6, 4, 8, 0.95)';
    ctx.fillRect(0, 0, 540, 960);

    // 標題
    ctx.fillStyle = '#ff1744';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🩸 黑道血祭禁忌神龕 🩸', 270, 180);

    ctx.fillStyle = '#9e9e9e';
    ctx.font = '12px sans-serif';
    ctx.fillText('簽訂浮士德惡魔契約：獲得毀滅級力量，但承擔致命代價！', 270, 210);

    for (let i = 0; i < 3; i++) {
      const pact = ALTAR_PACTS[i];
      const top = 250 + i * 145;
      const isHover = this.hoveredIndex === i;
      const isSigned = GameState.currentRun?.cursePacts?.includes(pact.id);

      ctx.fillStyle = isHover ? '#240d16' : '#140a0f';
      ctx.fillRect(35, top, 470, 130);

      ctx.strokeStyle = isSigned ? '#00e5ff' : (isHover ? '#ffffff' : pact.color);
      ctx.lineWidth = isHover ? 2.5 : 1.5;
      ctx.strokeRect(35, top, 470, 130);

      // 契約標題
      ctx.fillStyle = pact.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pact.name}  [${pact.subtitle}]`, 50, top + 22);

      // 賜福效果 (綠字)
      ctx.fillStyle = '#2ecc71';
      ctx.font = '12px sans-serif';
      ctx.fillText(`👑 恩賜：${pact.boonDesc}`, 50, top + 52);

      // 詛咒代價 (紅字)
      ctx.fillStyle = '#ff5252';
      ctx.font = '12px sans-serif';
      ctx.fillText(`☠️ 代價：${pact.curseDesc}`, 50, top + 80);

      // 選取提示按鈕
      ctx.fillStyle = isSigned ? '#00e5ff' : (isHover ? '#ffd700' : '#888888');
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      const statusText = isSigned ? '★ 已簽訂此契約' : `按 [${i + 1}] 簽訂契約`;
      ctx.fillText(statusText, 490, top + 112);
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
    ctx.fillText('拒絕誘惑 離開 [Space]', 270, 732);

    ctx.restore();
  }
}
