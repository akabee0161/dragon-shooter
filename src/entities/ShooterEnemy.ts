import { Container } from "pixi.js";
import { Enemy } from "./Enemy";
import { EnemyBullet } from "./EnemyBullet";
import { ObjectPool } from "../core/ObjectPool";
import type { IMovementStrategy } from "../strategies/IMovementStrategy";

/**
 * 弾を撃つ通常敵。ボスほど強くないが、プレイヤーに向けて弾を発射する。
 */
export class ShooterEnemy extends Enemy {
  /** 発射間隔（秒） */
  private fireCooldown = 2.0;
  private fireTimer = 0;

  private bulletPool: ObjectPool<EnemyBullet>;
  readonly enemyBullets: EnemyBullet[] = [];
  private container: Container;

  isShooter = true;

  constructor(container: Container) {
    super();
    this.container = container;

    this.bulletPool = new ObjectPool<EnemyBullet>(
      () => new EnemyBullet(),
      (b) => {
        b.vx = 0;
        b.vy = 0;
      },
      10,
    );
  }

  /** Factory から呼ばれる初期化（親のinitを呼んだ上で射撃タイマーをリセット） */
  override init(
    type: string,
    x: number,
    y: number,
    speed: number,
    strategy: IMovementStrategy,
  ): void {
    super.init(type, x, y, speed, strategy);
    this.fireTimer = 1.0; // 出現後少し待ってから撃ち始める
  }

  /** プレイヤー座標に向けて単発弾を発射 */
  private fireAtPlayer(playerX: number, playerY: number): void {
    const bullet = this.bulletPool.acquire();
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const angle = Math.atan2(dy, dx);
    const speed = 0.35;

    bullet.init(
      this.x,
      this.y + 0.02,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    );
    bullet.addToStage(this.container);
    this.enemyBullets.push(bullet);
  }

  /** プレイヤー座標を受け取って更新 */
  updateShooter(delta: number, playerX: number, playerY: number): void {
    // 発射タイマー
    this.fireTimer -= delta;
    if (this.fireTimer <= 0 && this.active) {
      this.fireAtPlayer(playerX, playerY);
      this.fireTimer = this.fireCooldown;
    }

    // 敵弾の更新
    for (const b of this.enemyBullets) {
      if (!b.active) continue;
      b.update(delta);
    }

    // 非アクティブ弾をプールに返却
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      if (!this.enemyBullets[i].active) {
        this.bulletPool.release(this.enemyBullets[i]);
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  /** 全弾回収 */
  clearBullets(): void {
    for (const b of this.enemyBullets) {
      b.deactivate();
      this.bulletPool.release(b);
    }
    this.enemyBullets.length = 0;
  }

  override deactivate(): void {
    this.clearBullets();
    super.deactivate();
  }
}
