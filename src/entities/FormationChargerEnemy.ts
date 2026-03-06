import { Enemy } from "./Enemy";

/**
 * 隊列を組んで連続突撃してくる敵。
 * waitDelay 秒間は上空で待機し、その後 ChargerEnemy と同様に
 * ロックオンして高速突進する。
 * 10 体セットで LevelManager から生成される。
 */
export class FormationChargerEnemy extends Enemy {
  /** 突進速度 */
  chargeSpeed = 0.95;

  /** 出現後に待機する秒数 */
  private waitTimer: number;

  /** 突進フェーズか */
  private charging = false;

  /** ロックオン時の進行角 */
  private chargeAngle = 0;

  /** この Y に到達したらロックオンして突進 */
  private readonly lockOnY = 0.15;

  /** LevelManager から毎フレーム渡されるプレイヤー座標 */
  private targetX = 0.5;
  private targetY = 0.8;

  constructor(waitDelay: number) {
    super();
    this.waitTimer = waitDelay;
  }

  /** プレイヤー座標を更新（LevelManager から呼ぶ） */
  setTarget(playerX: number, playerY: number): void {
    this.targetX = playerX;
    this.targetY = playerY;
  }

  override update(delta: number): void {
    // フェーズ0: 待機（隊列を保って上空に静止）
    if (this.waitTimer > 0) {
      this.waitTimer -= delta;
      this.syncPosition();
      return;
    }

    if (!this.charging) {
      // フェーズ1: ゆっくり降下してロックオン
      this.y += this.speed * delta;
      if (this.y >= this.lockOnY) {
        this.charging = true;
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.chargeAngle = Math.atan2(dy, dx);
      }
    } else {
      // フェーズ2: ロックオン方向に高速突進
      this.x += Math.cos(this.chargeAngle) * this.chargeSpeed * delta;
      this.y += Math.sin(this.chargeAngle) * this.chargeSpeed * delta;
    }

    this.syncPosition();

    if (this.y > 1.15 || this.y < -0.15 || this.x < -0.15 || this.x > 1.15) {
      this.deactivate();
    }
  }
}
