export interface TouchData {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  role: 'joystick' | 'aim_attack' | 'button';
  targetButton?: string;
}

export class InputManagerClass {
  // 鍵盤狀態
  public keys: { [key: string]: boolean } = {};
  public justPressedKeys: { [key: string]: boolean } = {};
  
  // 滑鼠狀態
  public mouseX: number = 270;
  public mouseY: number = 480;
  public isLmbDown: boolean = false;
  public isRmbDown: boolean = false;
  public isLmbJustPressed: boolean = false;
  public isRmbJustPressed: boolean = false;
  public wheelDelta: number = 0;

  // 手機觸控狀態 (多點觸控池)
  public isTouchDevice: boolean = false;
  public touchMoveX: number = 0;
  public touchMoveY: number = 0;
  public isSwiping: boolean = false;
  public swipeDirection: { x: number; y: number } = { x: 0, y: 0 };
  public touchAttack: boolean = false;
  public touchCharge: boolean = false;
  public touchSkill: boolean = false;
  public touchDodge: boolean = false;
  public touchSwap: boolean = false;
  public touchReload: boolean = false;

  // 虛擬搖桿可視化數據
  public joystickActive: boolean = false;
  public joystickOriginX: number = 0;
  public joystickOriginY: number = 0;
  public joystickCurrentX: number = 0;
  public joystickCurrentY: number = 0;

  private canvas: HTMLCanvasElement | null = null;
  private activeTouches: Map<number, TouchData> = new Map();
  private joystickTouchId: number | null = null;

  constructor() {
    this.isTouchDevice = 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  }

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys[code]) {
        this.justPressedKeys[code] = true;
      }
      this.keys[code] = true;

      // 阻止預設滾動
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  private setupMouse() {
    if (!this.canvas) return;

    window.addEventListener('mousemove', (e) => {
      this.updateMousePos(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isLmbDown = true;
        this.isLmbJustPressed = true;
      } else if (e.button === 2) {
        this.isRmbDown = true;
        this.isRmbJustPressed = true;
      } else if (e.button === 1) {
        // 中鍵釋放特技
        this.justPressedKeys['KeyE'] = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isLmbDown = false;
      if (e.button === 2) this.isRmbDown = false;
    });

    // 徹底禁止右鍵選單
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('wheel', (e) => {
      this.wheelDelta = e.deltaY;
      if (Math.abs(e.deltaY) > 10) {
        this.justPressedKeys['KeyQ'] = true;
      }
    }, { passive: true });
  }

  private setupTouch() {
    if (!this.canvas) return;

    const convertTouchPos = (touch: Touch) => {
      const rect = this.canvas!.getBoundingClientRect();
      const scaleX = 540 / rect.width;
      const scaleY = 960 / rect.height;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const now = performance.now();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const pos = convertTouchPos(t);
        const touchId = t.identifier;

        // 判斷觸控區域：左側為動態浮動搖桿，右側為動作按鈕與直瞄
        const buttonHit = this.checkButtonHit(pos.x, pos.y);
        if (buttonHit) {
          this.handleButtonPress(buttonHit, true);
          this.activeTouches.set(touchId, {
            id: touchId,
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
            startTime: now,
            role: 'button',
            targetButton: buttonHit
          });
          this.haptic(15);
        } else if (this.joystickTouchId === null) {
          // 全螢幕非按鈕區域皆可作為單手移動與蓄力搖桿
          this.joystickTouchId = touchId;
          this.joystickActive = true;
          this.joystickOriginX = pos.x;
          this.joystickOriginY = pos.y;
          this.joystickCurrentX = pos.x;
          this.joystickCurrentY = pos.y;

          this.activeTouches.set(touchId, {
            id: touchId,
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
            startTime: now,
            role: 'joystick'
          });
        } else {
          // 多指輔助點擊與瞄準
          this.mouseX = pos.x;
          this.mouseY = pos.y;
          this.isLmbJustPressed = true;

          this.activeTouches.set(touchId, {
            id: touchId,
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
            startTime: now,
            role: 'aim_attack'
          });
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const pos = convertTouchPos(t);
        const touchData = this.activeTouches.get(t.identifier);

        if (touchData) {
          touchData.currentX = pos.x;
          touchData.currentY = pos.y;

          if (touchData.role === 'joystick') {
            this.joystickCurrentX = pos.x;
            this.joystickCurrentY = pos.y;

            const dx = pos.x - this.joystickOriginX;
            const dy = pos.y - this.joystickOriginY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 55;

            if (dist > 8) {
              const clampedDist = Math.min(dist, maxRadius);
              const normalized = clampedDist / maxRadius;
              this.touchMoveX = (dx / dist) * normalized;
              this.touchMoveY = (dy / dist) * normalized;
            } else {
              this.touchMoveX = 0;
              this.touchMoveY = 0;
            }
          } else if (touchData.role === 'aim_attack') {
            this.mouseX = pos.x;
            this.mouseY = pos.y;
          }
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const now = performance.now();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const touchData = this.activeTouches.get(t.identifier);

        if (touchData) {
          const duration = now - touchData.startTime;
          const dx = touchData.currentX - touchData.startX;
          const dy = touchData.currentY - touchData.startY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (touchData.role === 'joystick') {
            // 滑動快速劃出 (Swipe Dodge)
            if (duration < 220 && dist > 40) {
              this.isSwiping = true;
              this.swipeDirection = { x: dx / dist, y: dy / dist };
              this.justPressedKeys['Space'] = true;
              this.haptic(25);
            }

            this.joystickActive = false;
            this.joystickTouchId = null;
            this.touchMoveX = 0;
            this.touchMoveY = 0;
          } else if (touchData.role === 'button' && touchData.targetButton) {
            this.handleButtonPress(touchData.targetButton, false);
          } else if (touchData.role === 'aim_attack') {
            this.touchAttack = false;
            this.isLmbDown = false;
          }

          this.activeTouches.delete(t.identifier);
        }
      }
    };

    this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  }

  private checkButtonHit(x: number, y: number): string | null {
    const buttons = [
      { id: 'dodge', x: 450, y: 760, r: 44 },
      { id: 'skill', x: 360, y: 780, r: 38 },
      { id: 'swap', x: 455, y: 650, r: 38 },
      { id: 'reload', x: 370, y: 680, r: 36 }
    ];

    for (const b of buttons) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) <= b.r) {
        return b.id;
      }
    }
    return null;
  }

  private handleButtonPress(buttonId: string, isDown: boolean) {
    if (buttonId === 'dodge') {
      this.touchDodge = isDown;
      if (isDown) this.justPressedKeys['Space'] = true;
    } else if (buttonId === 'skill') {
      this.touchSkill = isDown;
      if (isDown) this.justPressedKeys['KeyE'] = true;
    } else if (buttonId === 'swap') {
      this.touchSwap = isDown;
      if (isDown) this.justPressedKeys['KeyQ'] = true;
    } else if (buttonId === 'reload') {
      this.touchReload = isDown;
      if (isDown) this.justPressedKeys['KeyR'] = true;
    }
  }

  private updateMousePos(clientX: number, clientY: number) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = 540 / rect.width;
    const scaleY = 960 / rect.height;
    this.mouseX = (clientX - rect.left) * scaleX;
    this.mouseY = (clientY - rect.top) * scaleY;
  }

  public getMovementVector(): { x: number; y: number } {
    // 檢查手把輸入 (Gamepad)
    const gp = this.getGamepad();
    if (gp) {
      const gX = gp.axes[0] || 0;
      const gY = gp.axes[1] || 0;
      if (Math.abs(gX) > 0.15 || Math.abs(gY) > 0.15) {
        return { x: gX, y: gY };
      }
    }

    // 檢查手機觸控
    if (this.touchMoveX !== 0 || this.touchMoveY !== 0) {
      return { x: this.touchMoveX, y: this.touchMoveY };
    }

    // 檢查鍵盤 WASD
    let dx = 0;
    let dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    return { x: dx, y: dy };
  }

  public isKeyJustPressed(code: string): boolean {
    return !!this.justPressedKeys[code];
  }

  public getGamepad(): Gamepad | null {
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      return gamepads[0] || null;
    }
    return null;
  }

  public triggerRumble(duration: number = 100, strong: number = 0.5) {
    const gp = this.getGamepad();
    if (gp && (gp as any).vibrationActuator) {
      try {
        (gp as any).vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: duration,
          weakMagnitude: strong * 0.5,
          strongMagnitude: strong
        });
      } catch (e) {}
    }
    this.haptic(duration);
  }

  public haptic(pattern: number | number[] = 15) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  public postUpdate() {
    this.justPressedKeys = {};
    this.isLmbJustPressed = false;
    this.isRmbJustPressed = false;
    this.isSwiping = false;
    this.wheelDelta = 0;
    this.touchSwap = false;
    this.touchReload = false;
  }
}

export const InputManager = new InputManagerClass();
