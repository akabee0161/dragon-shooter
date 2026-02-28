import type { Enemy } from "../entities/Enemy";
import type { IMovementStrategy } from "./IMovementStrategy";

const enum Phase {
  ENTERING,
  FLOATING,
  CHARGING,
  RETREATING,
}

/**
 * ステージ4ボス用移動パターン。
 * 入場後に左右浮遊→下方突進→退避をループする。
 */
export class BossStage4Strategy implements IMovementStrategy {
  private phase = Phase.ENTERING;
  private elapsed = 0;
  private floatPhase = 0;

  private readonly targetY = 0.15;
  private readonly floatFreq = 0.6;
  private readonly floatAmp = 0.2;
  private readonly floatDuration = 3.0;
  private readonly chargeSpeed = 0.4;
  private readonly retreatSpeed = 0.5;
  private readonly chargeLimit = 0.72;

  update(enemy: Enemy, delta: number): void {
    this.elapsed += delta;

    switch (this.phase) {
      case Phase.ENTERING:
        enemy.y += enemy.speed * delta;
        if (enemy.y >= this.targetY) {
          enemy.y = this.targetY;
          this.floatPhase = 0;
          this.phase = Phase.FLOATING;
          this.elapsed = 0;
        }
        break;

      case Phase.FLOATING:
        this.floatPhase += this.floatFreq * delta;
        enemy.x = enemy.originX + Math.sin(this.floatPhase) * this.floatAmp;
        if (this.elapsed >= this.floatDuration) {
          this.phase = Phase.CHARGING;
          this.elapsed = 0;
        }
        break;

      case Phase.CHARGING:
        enemy.y += this.chargeSpeed * delta;
        if (enemy.y >= this.chargeLimit) {
          this.phase = Phase.RETREATING;
        }
        break;

      case Phase.RETREATING:
        enemy.y -= this.retreatSpeed * delta;
        if (enemy.y <= this.targetY) {
          enemy.y = this.targetY;
          // 現在のx位置からサイン波を継続
          const norm = Math.max(-1, Math.min(1, (enemy.x - enemy.originX) / this.floatAmp));
          this.floatPhase = Math.asin(norm);
          this.phase = Phase.FLOATING;
          this.elapsed = 0;
        }
        break;
    }
  }
}
