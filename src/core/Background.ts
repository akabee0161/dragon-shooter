import { TilingSprite, Container } from "pixi.js";
import { AssetLoader, TEX } from "./AssetLoader";
import { Game } from "./Game";

/**
 * 無限スクロールする星空背景。
 * TilingSprite の tilePosition.y を毎フレーム動かしてループさせる。
 */
export class Background {
  private tiling: TilingSprite;
  private speed = 60; // px/sec

  constructor(container: Container) {
    const game = Game.current;
    this.tiling = new TilingSprite({
      texture: AssetLoader.getTexture(TEX.BG),
      width: game.width,
      height: game.height,
    });
    container.addChildAt(this.tiling, 0); // 最背面に配置
  }

  update(delta: number): void {
    this.tiling.tilePosition.y += this.speed * delta;

    // リサイズ追従
    const game = Game.current;
    this.tiling.width = game.width;
    this.tiling.height = game.height;
  }
}
