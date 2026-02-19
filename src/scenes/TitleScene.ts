import { Container, Text, Graphics, TilingSprite } from "pixi.js";
import { Game } from "../core/Game";
import { AssetLoader, TEX } from "../core/AssetLoader";
import { AudioManager } from "../managers/AudioManager";

export class TitleScene {
  readonly container: Container;
  private bg: TilingSprite;
  private onStart: (() => void) | null = null;

  constructor() {
    this.container = new Container();

    const game = Game.current;

    // 星空背景
    this.bg = new TilingSprite({
      texture: AssetLoader.getTexture(TEX.BG),
      width: game.width,
      height: game.height,
    });
    this.container.addChild(this.bg);

    // タイトル
    const title = new Text({
      text: "Dragon\nShooter",
      style: {
        fontFamily: "monospace",
        fontSize: 56,
        fill: 0x44aaff,
        fontWeight: "bold",
        align: "center",
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 4,
          distance: 3,
          color: 0x000000,
        },
      },
    });
    title.anchor.set(0.5);
    title.x = game.width / 2;
    title.y = game.height * 0.3;
    this.container.addChild(title);

    // TAP TO START (点滅させるのでインスタンス保持)
    const tapText = new Text({
      text: "TAP TO START",
      style: {
        fontFamily: "monospace",
        fontSize: 28,
        fill: 0xffffff,
      },
    });
    tapText.anchor.set(0.5);
    tapText.x = game.width / 2;
    tapText.y = game.height * 0.6;
    this.container.addChild(tapText);

    // 点滅アニメーション
    let elapsed = 0;
    game.app.ticker.add((ticker) => {
      if (!this.container.visible) return;
      const delta = ticker.deltaTime / 60;
      elapsed += delta;
      tapText.alpha = 0.5 + Math.sin(elapsed * 4) * 0.5;
      this.bg.tilePosition.y += 30 * delta;
    });

    // タップで開始
    const hitArea = new Graphics();
    hitArea.rect(0, 0, game.width, game.height).fill({ color: 0x000000, alpha: 0.01 });
    hitArea.eventMode = "static";
    hitArea.cursor = "pointer";
    hitArea.on("pointerdown", () => this.handleStart());
    this.container.addChild(hitArea);
  }

  setOnStart(callback: () => void): void {
    this.onStart = callback;
  }

  show(): void {
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  private handleStart(): void {
    AudioManager.current.init();
    AudioManager.current.playBGM();
    if (this.onStart) this.onStart();
  }
}
