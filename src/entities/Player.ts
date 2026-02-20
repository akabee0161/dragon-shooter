import { Container } from "pixi.js";
import { Entity } from "./Entity";
import { Bullet } from "./Bullet";
import { ObjectPool } from "../core/ObjectPool";
import { AssetLoader, TEX } from "../core/AssetLoader";
import { AudioManager } from "../managers/AudioManager";

export class Player extends Entity {
  static readonly MAX_HP = 3;
  static readonly MAX_BOMBS = 3;

  hp = Player.MAX_HP;
  bombs = Player.MAX_BOMBS;

  /** 発射間隔（秒） */
  private fireCooldown = 0.2;
  private fireTimer = 0;

  /** 無敵状態 */
  isInvincible = false;
  private invincibleTimer = 0;
  private static readonly INVINCIBLE_DURATION = 2.0;
  private blinkTimer = 0;

  private bulletPool: ObjectPool<Bullet>;
  readonly bullets: Bullet[] = [];
  private container: Container;

  constructor(container: Container) {
    super(AssetLoader.getTexture(TEX.PLAYER));
    this.container = container;
    this.radius = 0.018;
    this.reset();

    this.bulletPool = new ObjectPool<Bullet>(
      () => new Bullet(),
      (b) => {
        b.speedY = -1.0;
      },
      20,
    );
  }

  /** InputManager から呼ばれる */
  moveTo(normX: number, normY: number): void {
    this.x = Math.max(0.02, Math.min(0.98, normX));
    this.y = Math.max(0.05, Math.min(0.95, normY));
  }

  /** ダメージを受ける。死亡した場合 true を返す */
  takeDamage(): boolean {
    if (this.isInvincible) return false;

    this.hp--;
    AudioManager.current.playSE("hit");
    if (this.hp <= 0) {
      this.hp = 0;
      this.deactivate();
      return true;
    }

    this.isInvincible = true;
    this.invincibleTimer = Player.INVINCIBLE_DURATION;
    return false;
  }

  /** ボムを1つ使用する。残数0なら false を返す */
  useBomb(): boolean {
    if (this.bombs <= 0) return false;
    this.bombs--;
    return true;
  }

  /** ゲームリセット時に呼ぶ */
  reset(): void {
    this.hp = Player.MAX_HP;
    this.bombs = Player.MAX_BOMBS;
    this.resetPosition();
  }

  /** ステージ遷移時に呼ぶ（HPは引き継ぐ） */
  resetPosition(): void {
    this.x = 0.5;
    this.y = 0.85;
    this.active = true;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.fireTimer = 0;
    this.sprite.alpha = 1;
    this.sprite.visible = true;
  }

  /** アクティブな弾をすべて回収 */
  clearBullets(): void {
    for (const bullet of this.bullets) {
      bullet.deactivate();
      this.bulletPool.release(bullet);
    }
    this.bullets.length = 0;
  }

  update(delta: number): void {
    this.syncPosition();

    // 無敵時間の更新（点滅）
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      this.blinkTimer += delta;
      this.sprite.alpha = Math.sin(this.blinkTimer * 20) > 0 ? 1 : 0.3;

      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.sprite.alpha = 1;
        this.blinkTimer = 0;
      }
    }

    // 自動発射
    this.fireTimer -= delta;
    if (this.fireTimer <= 0) {
      this.fire();
      this.fireTimer = this.fireCooldown;
    }

    // 弾の更新
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.update(delta);
    }

    // 非アクティブ弾をプールに返却
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (!this.bullets[i].active) {
        this.bulletPool.release(this.bullets[i]);
        this.bullets.splice(i, 1);
      }
    }
  }

  private fire(): void {
    const bullet = this.bulletPool.acquire();
    bullet.x = this.x;
    bullet.y = this.y - 0.03;
    bullet.active = true;
    bullet.addToStage(this.container);
    this.bullets.push(bullet);
    AudioManager.current.playSE("shot");
  }
}
