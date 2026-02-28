import { Entity } from "./Entity";
import { AssetLoader, TEX } from "../core/AssetLoader";

export class Bullet extends Entity {
  /** 正規化座標での毎秒移動量（負=上方向） */
  speedY = -1.0;
  /** 横方向の移動量（スプレッド用） */
  speedX = 0;
  /** ダメージ量（bulletLevelによって変化） */
  damage = 1;

  constructor() {
    super(AssetLoader.getTexture(TEX.BULLET));
  }

  /** 弾レベルに応じてテクスチャとダメージを設定 */
  setLevel(level: 0 | 1 | 2): void {
    this.damage = level + 1;
    const texKey = level === 1 ? TEX.BULLET_BLUE : level === 2 ? TEX.BULLET_RED : TEX.BULLET;
    this.sprite.texture = AssetLoader.getTexture(texKey);
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
