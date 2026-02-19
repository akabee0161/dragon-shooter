import { Entity } from "./Entity";
import { AssetLoader, TEX } from "../core/AssetLoader";

export class EnemyBullet extends Entity {
  /** 正規化座標での毎秒移動量 */
  vx = 0;
  vy = 0;

  constructor() {
    super(AssetLoader.getTexture(TEX.ENEMY_BULLET));
    this.radius = 0.01;
  }

  /** 発射位置と速度を設定 */
  init(x: number, y: number, vx: number, vy: number): void {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.active = true;
  }

  update(delta: number): void {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.syncPosition();

    // 画面外に出たら非アクティブ
    if (this.y > 1.1 || this.y < -0.1 || this.x < -0.1 || this.x > 1.1) {
      this.deactivate();
    }
  }
}
