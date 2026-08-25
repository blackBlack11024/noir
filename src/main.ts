import { InputManager } from './core/InputManager';
import { GameState } from './core/GameState';
import { SafehouseScene } from './scenes/SafehouseScene';
import { CombatScene } from './scenes/CombatScene';
import { RunSummaryModal } from './ui/RunSummaryModal';

class GameApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentScene: 'safehouse' | 'combat' | 'summary' = 'safehouse';
  private safehouseScene: SafehouseScene;
  private combatScene: CombatScene;
  private summaryModal: RunSummaryModal;
  private lastTime: number = 0;
  private dpr: number = 1;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    InputManager.init(this.canvas);
    this.safehouseScene = new SafehouseScene();
    this.combatScene = new CombatScene();
    this.summaryModal = new RunSummaryModal();

    this.safehouseScene.init();
    this.lastTime = performance.now();

    requestAnimationFrame((t) => this.loop(t));
  }

  private resize() {
    // 獲取螢幕真實像素比 (Retina / 2K / 4K / Mobile HiDPI)，最高支援 3x 超高清
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    const logicalWidth = 540;
    const logicalHeight = 960;

    // 將內部緩衝區畫素擴展為真實物理畫素
    this.canvas.width = Math.round(logicalWidth * this.dpr);
    this.canvas.height = Math.round(logicalHeight * this.dpr);

    // 平滑與高質量渲染
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private loop(now: number) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // F1 開發者測試模式
    if (InputManager.isKeyJustPressed('F1')) {
      GameState.toggleDebugUnlock();
    }

    // 場景流轉更新
    if (this.currentScene === 'safehouse') {
      const next = this.safehouseScene.update();
      if (next === 'start_run') {
        this.currentScene = 'combat';
        this.combatScene.initRoom();
      }
    } else if (this.currentScene === 'combat') {
      const next = this.combatScene.update(dt);
      if (next === 'summary') {
        this.currentScene = 'summary';
        if (GameState.lastRunSummary) {
          this.summaryModal.open(GameState.lastRunSummary);
        }
      }
    } else if (this.currentScene === 'summary') {
      const next = this.summaryModal.update();
      if (next === 'return_safehouse') {
        this.currentScene = 'safehouse';
        this.safehouseScene.init();
      }
    }

    // 渲染 (透過 setTransform 將 540x960 邏輯座標映射至高清物理畫素)
    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(0, 0, 540, 960);

    if (this.currentScene === 'safehouse') {
      this.safehouseScene.render(this.ctx);
    } else if (this.currentScene === 'combat') {
      this.combatScene.render(this.ctx);
    } else if (this.currentScene === 'summary') {
      // 結算畫面疊加於戰鬥背景之上
      this.combatScene.render(this.ctx);
      this.summaryModal.render(this.ctx);
    }
    this.ctx.restore();

    InputManager.postUpdate();
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});


