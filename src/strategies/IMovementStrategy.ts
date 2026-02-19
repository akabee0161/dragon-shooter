import type { Enemy } from "../entities/Enemy";

export interface IMovementStrategy {
  update(enemy: Enemy, delta: number): void;
}
