import { Sprite, Container, Texture } from "pixi.js";
import { Game } from "../core/Game";

export abstract class Entity {
  /** 正規化座標 (0.0 - 1.0) */
  x = 0;
  y = 0;

  /** 当たり判定半径（正規化座標） */
  radius = 0.02;

  active = false;
  sprite: Sprite;

  constructor(texture?: Texture) {
    this.sprite = new Sprite(texture ?? Texture.WHITE);
    this.sprite.anchor.set(0.5);
  }

  /** 正規化座標に基づいてスプライトのピクセル位置を更新 */
  syncPosition(): void {
    const game = Game.current;
    this.sprite.x = game.toPixelX(this.x);
    this.sprite.y = game.toPixelY(this.y);
  }

  /** 毎フレーム呼ばれる (deltaはフレーム経過秒) */
  abstract update(delta: number): void;

  /** ステージに追加 */
  addToStage(container: Container): void {
    container.addChild(this.sprite);
    this.active = true;
    this.sprite.visible = true;
  }

  /** ステージから除去（プール返却前に呼ぶ） */
  deactivate(): void {
    this.active = false;
    this.sprite.visible = false;
  }
}
