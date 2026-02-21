import { Application, Container } from "pixi.js";

export type GameState = "playing" | "gameover" | "gameclear" | "loading";

export class Game {
  app: Application;
  gameContainer: Container;

  /** 論理ゲーム領域のピクセルサイズ（resize時に更新） */
  width = 0;
  height = 0;

  state: GameState = "playing";
  difficulty: "easy" | "normal" = "normal";

  /** Screen Shake */
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;

  private static instance: Game;

  static get current(): Game {
    return Game.instance;
  }

  constructor() {
    this.app = new Application();
    this.gameContainer = new Container();
    Game.instance = this;
  }

  async init(): Promise<void> {
    await this.app.init({
      background: "#1a1a2e",
      resizeTo: window,
      antialias: true,
    });
    document.body.appendChild(this.app.canvas);

    this.app.stage.addChild(this.gameContainer);
    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  /** 画面を揺らす */
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  /** 毎フレーム呼び出してシェイクを適用 */
  updateShake(delta: number): void {
    if (this.shakeTimer <= 0) {
      this.gameContainer.x = 0;
      this.gameContainer.y = 0;
      return;
    }

    this.shakeTimer -= delta;
    const ratio = Math.max(0, this.shakeTimer / this.shakeDuration);
    const intensity = this.shakeIntensity * ratio;

    this.gameContainer.x = (Math.random() - 0.5) * 2 * intensity;
    this.gameContainer.y = (Math.random() - 0.5) * 2 * intensity;

    if (this.shakeTimer <= 0) {
      this.gameContainer.x = 0;
      this.gameContainer.y = 0;
    }
  }

  /** 正規化座標 (0-1) → 実ピクセル座標 に変換 */
  toPixelX(normalized: number): number {
    return normalized * this.width;
  }

  toPixelY(normalized: number): number {
    return normalized * this.height;
  }

  /** 実ピクセル座標 → 正規化座標 (0-1) に変換 */
  toNormX(pixel: number): number {
    return pixel / this.width;
  }

  toNormY(pixel: number): number {
    return pixel / this.height;
  }

  private handleResize(): void {
    this.width = this.app.screen.width;
    this.height = this.app.screen.height;
  }
}
