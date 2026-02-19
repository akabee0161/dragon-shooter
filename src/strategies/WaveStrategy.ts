import type { Enemy } from "../entities/Enemy";
import type { IMovementStrategy } from "./IMovementStrategy";

/** サイン波で左右に揺れながら降りてくる移動パターン */
export class WaveStrategy implements IMovementStrategy {
  private frequency: number;
  private amplitude: number;
  private elapsed = 0;

  constructor(frequency = 3.0, amplitude = 0.15) {
    this.frequency = frequency;
    this.amplitude = amplitude;
  }

  update(enemy: Enemy, delta: number): void {
    this.elapsed += delta;

    // 下方向に移動
    enemy.y += enemy.speed * delta;

    // 出現時のX座標を中心に左右に揺れる
    enemy.x = enemy.originX + Math.sin(this.elapsed * this.frequency) * this.amplitude;
  }
}
