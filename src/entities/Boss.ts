import { Container } from "pixi.js";
import { Enemy } from "./Enemy";
import { EnemyBullet } from "./EnemyBullet";
import { ObjectPool } from "../core/ObjectPool";
import { Game } from "../core/Game";

/**
 * ボスエネミー。高HP、大きいサイズ、敵弾を発射する。
 */
export class Boss extends Enemy {
  static readonly MAX_HP = 50;

  /** 発射間隔（秒） */
  private fireCooldown = 1.0;
  private fireTimer = 0;
  /** 発射パターンのカウンター */
  private shotCount = 0;

  private bulletPool: ObjectPool<EnemyBullet>;
  readonly enemyBullets: EnemyBullet[] = [];
  private container: Container;

  /** ボスが存在するかのフラグ */
  isBoss = true;

  constructor(container: Container) {
    super();
    this.container = container;
    this.radius = 0.06;
    this.score = 3000;

    this.bulletPool = new ObjectPool<EnemyBullet>(
      () => new EnemyBullet(),
      (b) => {
        b.vx = 0;
        b.vy = 0;
      },
      30,
    );
  }

  /** プレイヤー座標に向けて弾を発射 */
  private fireAtPlayer(playerX: number, playerY: number): void {
    this.shotCount++;

    if (this.shotCount % 3 === 0) {
      // 3-Way 扇状弾
      const angles = [-0.3, 0, 0.3];
      for (const offset of angles) {
        this.fireBullet(playerX, playerY, offset);
      }
    } else {
      // 自機狙い弾
      this.fireBullet(playerX, playerY, 0);
    }
  }

  private fireBullet(
    targetX: number,
    targetY: number,
    angleOffset: number,
  ): void {
    const bullet = this.bulletPool.acquire();
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 0.5;

    let angle = Math.atan2(dy, dx) + angleOffset;
    bullet.init(
      this.x,
      this.y + 0.04,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    );
    bullet.addToStage(this.container);
    this.enemyBullets.push(bullet);
  }

  /** プレイヤー座標を受け取って更新 */
  updateBoss(delta: number, playerX: number, playerY: number): void {
    // 基本移動（strategy）
    super.update(delta);

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

  /** ダメージ処理（deactivateはしない、HPバー更新のため外部で判定する） */
  override takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.clearBullets();
      this.deactivate();
    }
  }
}
