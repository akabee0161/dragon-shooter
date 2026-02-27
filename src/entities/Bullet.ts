import { Entity } from "./Entity";
import { AssetLoader, TEX } from "../core/AssetLoader";

export class Bullet extends Entity {
  /** 正規化座標での毎秒移動量（負=上方向） */
  speedY = -1.0;
  /** 横方向の移動量（スプレッド用） */
  speedX = 0;

  constructor() {
    super(AssetLoader.getTexture(TEX.BULLET));
  }

  update(delta: number): void {
    this.x += this.speedX * delta;
    this.y += this.speedY * delta;
    this.syncPosition();

    // 画面外に出たら非アクティブ
    if (this.y < -0.05 || this.x < -0.05 || this.x > 1.05) {
      this.deactivate();
    }
  }
}
