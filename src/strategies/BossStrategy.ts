import type { Enemy } from "../entities/Enemy";
import type { IMovementStrategy } from "./IMovementStrategy";

/**
 * ボス用移動パターン。
 * 画面上部に移動した後、左右にゆっくり浮遊する。
 */
export class BossStrategy implements IMovementStrategy {
  private elapsed = 0;
  private readonly targetY = 0.15;
  private readonly floatFreq = 0.8;
  private readonly floatAmp = 0.15;
  private arrived = false;

  update(enemy: Enemy, delta: number): void {
    this.elapsed += delta;

    if (!this.arrived) {
      // 上部の定位置まで移動
      enemy.y += enemy.speed * delta;
      if (enemy.y >= this.targetY) {
        enemy.y = this.targetY;
        this.arrived = true;
        this.elapsed = 0;
      }
    } else {
      // 左右にゆっくり浮遊
      enemy.x =
        enemy.originX +
        Math.sin(this.elapsed * this.floatFreq) * this.floatAmp;
    }
  }
}
