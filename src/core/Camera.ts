export class Camera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public width: number = 540;
  public height: number = 960;
  
  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;
  private punchOffsetX: number = 0;
  private punchOffsetY: number = 0;

  constructor(width: number = 540, height: number = 960) {
    this.width = width;
    this.height = height;
  }

  public update(dt: number) {
    // 平滑插值跟隨目標
    const lerpFactor = 0.15;
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    // 螢幕震動衰減
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // 擊退頓挫恢復
    this.punchOffsetX *= 0.85;
    this.punchOffsetY *= 0.85;
  }

  public shake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  public punch(angle: number, distance: number) {
    this.punchOffsetX = Math.cos(angle) * distance;
    this.punchOffsetY = Math.sin(angle) * distance;
  }

  public getOffsetX(): number {
    let sX = 0;
    if (this.shakeIntensity > 0) {
      sX = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }
    return sX + this.punchOffsetX;
  }

  public getOffsetY(): number {
    let sY = 0;
    if (this.shakeIntensity > 0) {
      sY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }
    return sY + this.punchOffsetY;
  }
}
