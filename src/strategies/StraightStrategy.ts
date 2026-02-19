import type { Enemy } from "../entities/Enemy";
import type { IMovementStrategy } from "./IMovementStrategy";

/** まっすぐ下に降りてくる移動パターン */
export class StraightStrategy implements IMovementStrategy {
  update(enemy: Enemy, delta: number): void {
    enemy.y += enemy.speed * delta;
  }
}
