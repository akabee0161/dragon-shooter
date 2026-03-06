import type { Enemy } from "../entities/Enemy";
import type { IMovementStrategy } from "./IMovementStrategy";

const enum Phase {
  ENTERING,
  FLOATING,
  CHARGING,
  RETREATING,
  DIAGONAL_LR,     // 左上 → 右下 突進
  DIAGONAL_RL,     // 右上 → 左下 突進
  DIAGONAL_RETREAT,
}

/**
 * ステージ5ボス用移動パターン。
 * ステージ4の動き（入場→浮遊→下方突進→退避）に加え、
 * 斜め突進（左上↘右下 / 右上↙左下）を交互に繰り出す。
 */
export class BossStage5Strategy implements IMovementStrategy {
  private phase = Phase.ENTERING;
  private elapsed = 0;
  private floatPhase = 0;

  /** 斜め突進フェーズで「始点への移動」が完了しているか */
  private repositioning = true;
  /** 斜め突進の速度ベクトル */
  private diagonalVx = 0;
  private diagonalVy = 0;
  /** LR / RL を交互に切り替えるカウンター */
  private diagonalCycle = 0;

  private readonly targetY = 0.15;
  private readonly floatFreq = 0.65;
  private readonly floatAmp = 0.22;
  private readonly floatDuration = 2.5;
  private readonly chargeSpeed = 0.45;
  private readonly retreatSpeed = 0.6;
  private readonly chargeLimit = 0.72;
  private readonly diagonalDashSpeed = 0.7;
  private readonly repositionSpeed = 0.75;

  update(enemy: Enemy, delta: number): void {
    this.elapsed += delta;

    switch (this.phase) {
      case Phase.ENTERING:
        enemy.y += enemy.speed * delta;
        if (enemy.y >= this.targetY) {
          enemy.y = this.targetY;
          this.floatPhase = 0;
          this.elapsed = 0;
          this.phase = Phase.FLOATING;
        }
        break;

      case Phase.FLOATING:
        this.floatPhase += this.floatFreq * delta;
        enemy.x = enemy.originX + Math.sin(this.floatPhase) * this.floatAmp;
        if (this.elapsed >= this.floatDuration) {
          this.elapsed = 0;
          this.phase = Phase.CHARGING;
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
          this.repositioning = true;
          // LR / RL を交互に選択
          this.phase = this.diagonalCycle % 2 === 0 ? Phase.DIAGONAL_LR : Phase.DIAGONAL_RL;
          this.diagonalCycle++;
        }
        break;

      case Phase.DIAGONAL_LR: {
        if (this.repositioning) {
          // 左上コーナー (0.1, 0.12) へ移動
          const tx = 0.1, ty = 0.12;
          const dx = tx - enemy.x;
          const dy = ty - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.025) {
            // 始点到達 → 右下(0.9, 0.72)方向のベクトルを計算して突進開始
            this.repositioning = false;
            const ddx = 0.9 - 0.1;
            const ddy = 0.72 - 0.12;
            const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
            this.diagonalVx = (ddx / ddist) * this.diagonalDashSpeed;
            this.diagonalVy = (ddy / ddist) * this.diagonalDashSpeed;
          } else {
            enemy.x += (dx / dist) * this.repositionSpeed * delta;
            enemy.y += (dy / dist) * this.repositionSpeed * delta;
          }
        } else {
          enemy.x += this.diagonalVx * delta;
          enemy.y += this.diagonalVy * delta;
          if (enemy.x >= 0.88 || enemy.y >= this.chargeLimit) {
            this.phase = Phase.DIAGONAL_RETREAT;
          }
        }
        break;
      }

      case Phase.DIAGONAL_RL: {
        if (this.repositioning) {
          // 右上コーナー (0.9, 0.12) へ移動
          const tx = 0.9, ty = 0.12;
          const dx = tx - enemy.x;
          const dy = ty - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.025) {
            // 始点到達 → 左下(0.1, 0.72)方向のベクトルを計算して突進開始
            this.repositioning = false;
            const ddx = 0.1 - 0.9;
            const ddy = 0.72 - 0.12;
            const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
            this.diagonalVx = (ddx / ddist) * this.diagonalDashSpeed;
            this.diagonalVy = (ddy / ddist) * this.diagonalDashSpeed;
          } else {
            enemy.x += (dx / dist) * this.repositionSpeed * delta;
            enemy.y += (dy / dist) * this.repositionSpeed * delta;
          }
        } else {
          enemy.x += this.diagonalVx * delta;
          enemy.y += this.diagonalVy * delta;
          if (enemy.x <= 0.12 || enemy.y >= this.chargeLimit) {
            this.phase = Phase.DIAGONAL_RETREAT;
          }
        }
        break;
      }

      case Phase.DIAGONAL_RETREAT: {
        // 中央上部 (0.5, targetY) へ戻る
        const tx = 0.5, ty = this.targetY;
        const dx = tx - enemy.x;
        const dy = ty - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.025) {
          enemy.x = tx;
          enemy.y = ty;
          this.floatPhase = 0;
          this.elapsed = 0;
          this.phase = Phase.FLOATING;
        } else {
          enemy.x += (dx / dist) * this.retreatSpeed * delta;
          enemy.y += (dy / dist) * this.retreatSpeed * delta;
        }
        break;
      }
    }
  }
}
