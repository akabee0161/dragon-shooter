import { Container, Text, Graphics, TilingSprite } from "pixi.js";
import { Game } from "../core/Game";
import { AssetLoader, TEX } from "../core/AssetLoader";
import { AudioManager } from "../managers/AudioManager";

export class TitleScene {
  readonly container: Container;
  private bg: TilingSprite;
  private onStart: ((difficulty: "easy" | "normal") => void) | null = null;

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

    // NORMAL ボタン
    this.addButton(
      "NORMAL",
      0x2266cc,
      0x4488ff,
      game.height * 0.57,
      () => this.handleStart("normal"),
    );

    // EASY ボタン
    this.addButton(
      "EASY",
      0x226622,
      0x44cc44,
      game.height * 0.71,
      () => this.handleStart("easy"),
    );

    // 背景スクロールアニメーション
    game.app.ticker.add((ticker) => {
      if (!this.container.visible) return;
      const delta = ticker.deltaTime / 60;
      this.bg.tilePosition.y += 30 * delta;
    });
  }

  private addButton(
    label: string,
    fillColor: number,
    strokeColor: number,
    centerY: number,
    onClick: () => void,
  ): void {
    const game = Game.current;
    const btnW = 180;
    const btnH = 52;
    const btnX = game.width / 2 - btnW / 2;
    const btnY = centerY - btnH / 2;

    const btn = new Graphics();
    btn.roundRect(btnX, btnY, btnW, btnH, 10).fill(fillColor);
    btn.roundRect(btnX, btnY, btnW, btnH, 10).stroke({ color: strokeColor, width: 2 });
    btn.eventMode = "static";
    btn.cursor = "pointer";
    btn.on("pointerdown", onClick);
    this.container.addChild(btn);

    const text = new Text({
      text: label,
      style: {
        fontFamily: "monospace",
        fontSize: 26,
        fill: 0xffffff,
        fontWeight: "bold",
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 2,
          distance: 2,
          color: 0x000000,
        },
      },
    });
    text.anchor.set(0.5);
    text.x = game.width / 2;
    text.y = centerY;
    this.container.addChild(text);
  }

  setOnStart(callback: (difficulty: "easy" | "normal") => void): void {
    this.onStart = callback;
  }

  show(): void {
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  private handleStart(difficulty: "easy" | "normal"): void {
    AudioManager.current.init();
    AudioManager.current.playBGM();
    if (this.onStart) this.onStart(difficulty);
  }
}
