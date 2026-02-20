import { Container, Graphics, Text } from "pixi.js";
import { Game } from "../core/Game";
import { Player } from "../entities/Player";

export class GameUI {
  private scoreText: Text;
  private hpText: Text;
  private score = 0;

  /** Game Over オーバーレイ */
  private overlay: Container;
  private onRetry: (() => void) | null = null;

  /** ボムボタン */
  private bombBtn: Graphics;
  private bombBtnText: Text;
  private onBomb: (() => void) | null = null;

  /** ボム赤フラッシュ */
  private bombFlash: Graphics;
  private bombFlashAlpha = 0;

  /** Boss HP Bar */
  private bossBarContainer: Container;
  private bossBarBg: Graphics;
  private bossBarFill: Graphics;
  private bossBarWidth = 0;

  constructor(stage: Container) {
    // スコア表示（左上）
    this.scoreText = new Text({
      text: "SCORE: 0",
      style: {
        fontFamily: "monospace",
        fontSize: 24,
        fill: 0xffffff,
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 2,
          distance: 2,
          color: 0x000000,
        },
      },
    });
    this.scoreText.x = 10;
    this.scoreText.y = 10;
    stage.addChild(this.scoreText);

    // HP表示（左下）
    this.hpText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 28,
        fill: 0xff6666,
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 2,
          distance: 2,
          color: 0x000000,
        },
      },
    });
    this.hpText.anchor.set(0, 1);
    stage.addChild(this.hpText);

    // Boss HP Bar（非表示で初期化）
    this.bossBarContainer = new Container();
    this.bossBarContainer.visible = false;
    this.bossBarBg = new Graphics();
    this.bossBarFill = new Graphics();
    this.bossBarContainer.addChild(this.bossBarBg);
    this.bossBarContainer.addChild(this.bossBarFill);
    stage.addChild(this.bossBarContainer);

    // Game Over オーバーレイ（非表示で初期化）
    this.overlay = new Container();
    this.overlay.visible = false;
    stage.addChild(this.overlay);

    // ボムボタン（右下、セーフエリアを考慮）
    const game = Game.current;
    const btnW = 120;
    const btnH = 50;
    const btnX = game.width - btnW - 15;
    const btnY = game.height - btnH - 55;

    this.bombBtn = new Graphics();
    this.bombBtn.roundRect(btnX, btnY, btnW, btnH, 10).fill(0xff4400);
    this.bombBtn.roundRect(btnX, btnY, btnW, btnH, 10).stroke({ color: 0xff8800, width: 2 });
    this.bombBtn.eventMode = "static";
    this.bombBtn.cursor = "pointer";
    this.bombBtn.on("pointerdown", () => {
      if (this.onBomb) this.onBomb();
    });
    stage.addChild(this.bombBtn);

    this.bombBtnText = new Text({
      text: `BOMB ×${Player.MAX_BOMBS}`,
      style: {
        fontFamily: "monospace",
        fontSize: 18,
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
    this.bombBtnText.anchor.set(0.5);
    this.bombBtnText.x = btnX + btnW / 2;
    this.bombBtnText.y = btnY + btnH / 2;
    stage.addChild(this.bombBtnText);

    // ボム赤フラッシュ（最前面）
    this.bombFlash = new Graphics();
    this.bombFlash.rect(0, 0, game.width, game.height).fill({ color: 0xff2200, alpha: 1 });
    this.bombFlash.alpha = 0;
    stage.addChild(this.bombFlash);
  }

  addScore(amount: number): void {
    this.score += amount;
    this.scoreText.text = `SCORE: ${this.score}`;
  }

  updateHP(hp: number): void {
    const hearts = "\u2764 ".repeat(hp).trim();
    this.hpText.text = hearts || "---";
    const game = Game.current;
    this.hpText.x = 15;
    this.hpText.y = game.height - 55;
  }

  get currentScore(): number {
    return this.score;
  }

  /** リトライコールバックを登録 */
  setOnRetry(callback: () => void): void {
    this.onRetry = callback;
  }

  /** ボムコールバックを登録 */
  setOnBomb(callback: () => void): void {
    this.onBomb = callback;
  }

  /** ボム残数を更新 */
  updateBombs(count: number): void {
    this.bombBtnText.text = `BOMB ×${count}`;
    if (count <= 0) {
      this.bombBtn.tint = 0x888888;
    } else {
      this.bombBtn.tint = 0xffffff;
    }
  }

  /** ボム赤フラッシュを開始 */
  showBombFlash(): void {
    this.bombFlashAlpha = 0.85;
    this.bombFlash.alpha = this.bombFlashAlpha;
  }

  /** フレームごとに呼ぶ（フラッシュフェードアウト） */
  update(delta: number): void {
    if (this.bombFlashAlpha > 0) {
      this.bombFlashAlpha -= delta * 1.2;
      if (this.bombFlashAlpha < 0) this.bombFlashAlpha = 0;
      this.bombFlash.alpha = this.bombFlashAlpha;
    }
  }

  // --- Boss HP Bar ---

  /** ボスHPバーを表示 */
  showBossBar(): void {
    const game = Game.current;
    this.bossBarWidth = game.width * 0.6;
    const barHeight = 12;
    const barX = (game.width - this.bossBarWidth) / 2;
    const barY = 40;

    this.bossBarBg.clear();
    this.bossBarBg.roundRect(barX, barY, this.bossBarWidth, barHeight, 4).fill({
      color: 0x333333,
      alpha: 0.8,
    });
    // 枠線
    this.bossBarBg
      .roundRect(barX, barY, this.bossBarWidth, barHeight, 4)
      .stroke({ color: 0x888888, width: 1 });

    this.bossBarFill.clear();
    this.bossBarFill
      .roundRect(barX + 1, barY + 1, this.bossBarWidth - 2, barHeight - 2, 3)
      .fill(0xff2222);

    this.bossBarContainer.visible = true;
  }

  /** ボスHPバーを更新 (ratio: 0.0 ~ 1.0) */
  updateBossBar(ratio: number): void {
    if (!this.bossBarContainer.visible) return;
    const game = Game.current;
    const barHeight = 12;
    const barX = (game.width - this.bossBarWidth) / 2;
    const barY = 40;
    const fillWidth = Math.max(0, (this.bossBarWidth - 2) * ratio);

    this.bossBarFill.clear();
    if (fillWidth > 0) {
      // HPが低いと色が変わる
      const color = ratio > 0.3 ? 0xff2222 : 0xff8800;
      this.bossBarFill
        .roundRect(barX + 1, barY + 1, fillWidth, barHeight - 2, 3)
        .fill(color);
    }
  }

  /** ボスHPバーを非表示 */
  hideBossBar(): void {
    this.bossBarContainer.visible = false;
  }

  // --- Game Over / Game Clear ---

  showGameOver(): void {
    this.showEndScreen("GAME OVER", 0xff4444);
  }

  showGameClear(): void {
    this.showEndScreen("GAME CLEAR!!", 0x44ff44);
  }

  private showEndScreen(title: string, color: number): void {
    const game = Game.current;
    this.overlay.removeChildren();

    // 半透明背景
    const bg = new Graphics();
    bg.rect(0, 0, game.width, game.height).fill({ color: 0x000000, alpha: 0.6 });
    this.overlay.addChild(bg);

    // タイトルテキスト
    const titleText = new Text({
      text: title,
      style: {
        fontFamily: "monospace",
        fontSize: 64,
        fill: color,
        fontWeight: "bold",
      },
    });
    titleText.anchor.set(0.5);
    titleText.x = game.width / 2;
    titleText.y = game.height / 2 - 60;
    this.overlay.addChild(titleText);

    // スコア表示
    const finalScore = new Text({
      text: `SCORE: ${this.score}`,
      style: {
        fontFamily: "monospace",
        fontSize: 32,
        fill: 0xffffff,
      },
    });
    finalScore.anchor.set(0.5);
    finalScore.x = game.width / 2;
    finalScore.y = game.height / 2 + 10;
    this.overlay.addChild(finalScore);

    // RETRY ボタン
    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = game.width / 2 - btnWidth / 2;
    const btnY = game.height / 2 + 60;

    const btn = new Graphics();
    btn.roundRect(btnX, btnY, btnWidth, btnHeight, 8).fill(0x44aaff);
    btn.eventMode = "static";
    btn.cursor = "pointer";
    btn.on("pointerdown", () => {
      if (this.onRetry) this.onRetry();
    });
    this.overlay.addChild(btn);

    const retryText = new Text({
      text: "RETRY",
      style: {
        fontFamily: "monospace",
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    retryText.anchor.set(0.5);
    retryText.x = game.width / 2;
    retryText.y = btnY + btnHeight / 2;
    this.overlay.addChild(retryText);

    this.overlay.visible = true;
  }

  hideGameOver(): void {
    this.overlay.visible = false;
  }

  /** ステージ名を画面中央に表示し、フェードアウトする */
  showStageTitle(label: string): void {
    const game = Game.current;

    const stageText = new Text({
      text: label,
      style: {
        fontFamily: "monospace",
        fontSize: 48,
        fill: 0xffffff,
        fontWeight: "bold",
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 4,
          distance: 3,
          color: 0x000000,
        },
      },
    });
    stageText.anchor.set(0.5);
    stageText.x = game.width / 2;
    stageText.y = game.height / 2;
    this.stage.addChild(stageText);

    // フェードアウトアニメーション
    let elapsed = 0;
    const onTick = (ticker: { deltaTime: number }) => {
      const delta = ticker.deltaTime / 60;
      elapsed += delta;

      if (elapsed < 1.5) {
        // 最初の1.5秒は表示
        stageText.alpha = 1;
      } else if (elapsed < 2.5) {
        // 次の1秒でフェードアウト
        stageText.alpha = 1 - (elapsed - 1.5);
      } else {
        // 完了 → 除去
        this.stage.removeChild(stageText);
        game.app.ticker.remove(onTick);
      }
    };
    game.app.ticker.add(onTick);
  }

  /** スコア・HPテキスト含むUIの表示/非表示 */
  setVisible(visible: boolean): void {
    this.scoreText.visible = visible;
    this.hpText.visible = visible;
    this.bombBtn.visible = visible;
    this.bombBtnText.visible = visible;
    if (!visible) {
      this.overlay.visible = false;
      this.bossBarContainer.visible = false;
    }
  }

  /** スコアをリセット */
  resetScore(): void {
    this.score = 0;
    this.scoreText.text = "SCORE: 0";
  }
}
