import { Container, Graphics } from "pixi.js";
import { ObjectPool } from "../core/ObjectPool";
import { Game } from "../core/Game";

interface Particle {
  graphics: Graphics;
  /** 正規化座標 */
  x: number;
  y: number;
  /** 正規化座標での毎秒移動量 */
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class EffectManager {
  private container: Container;
  private pool: ObjectPool<Particle>;
  private activeParticles: Particle[] = [];

  private static readonly PARTICLE_COUNT = 12;
  private static readonly PARTICLE_LIFE = 0.4;
  private static readonly PARTICLE_SPEED = 0.6;

  constructor(container: Container) {
    this.container = container;

    this.pool = new ObjectPool<Particle>(
      () => ({
        graphics: new Graphics(),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        active: false,
      }),
      (p) => {
        p.active = false;
        p.graphics.visible = false;
      },
      60,
    );
  }

  /** 指定位置に爆発エフェクトを生成 */
  spawnExplosion(normX: number, normY: number, color: number): void {
    for (let i = 0; i < EffectManager.PARTICLE_COUNT; i++) {
      const p = this.pool.acquire();

      // ランダムな方向に飛ばす
      const angle = (Math.PI * 2 * i) / EffectManager.PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
      const speed = EffectManager.PARTICLE_SPEED * (0.5 + Math.random() * 0.5);

      p.x = normX;
      p.y = normY;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = EffectManager.PARTICLE_LIFE;
      p.maxLife = EffectManager.PARTICLE_LIFE;
      p.active = true;

      // 描画
      p.graphics.clear();
      const size = 2 + Math.random() * 3;
      p.graphics.rect(-size / 2, -size / 2, size, size).fill(color);
      p.graphics.visible = true;

      if (!p.graphics.parent) {
        this.container.addChild(p.graphics);
      }

      this.activeParticles.push(p);
    }
  }

  /** ボム使用時に画面各所で爆発を生成 */
  spawnBombExplosions(): void {
    const positions = [
      [0.15, 0.2], [0.5, 0.15], [0.85, 0.2],
      [0.25, 0.45], [0.75, 0.45],
      [0.15, 0.7], [0.5, 0.65], [0.85, 0.7],
      [0.35, 0.35], [0.65, 0.35],
    ];
    for (const [x, y] of positions) {
      this.spawnExplosion(x, y, 0xff4400);
    }
  }

  /** 全パーティクルをプールに返却 */
  reset(): void {
    for (const p of this.activeParticles) {
      p.active = false;
      p.graphics.visible = false;
      this.pool.release(p);
    }
    this.activeParticles.length = 0;
  }

  update(delta: number): void {
    const game = Game.current;

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      if (!p.active) {
        this.pool.release(p);
        this.activeParticles.splice(i, 1);
        continue;
      }

      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        p.graphics.visible = false;
        this.pool.release(p);
        this.activeParticles.splice(i, 1);
        continue;
      }

      // 移動
      p.x += p.vx * delta;
      p.y += p.vy * delta;

      // フェードアウト
      p.graphics.alpha = p.life / p.maxLife;

      // ピクセル座標に変換
      p.graphics.x = game.toPixelX(p.x);
      p.graphics.y = game.toPixelY(p.y);
    }
  }
}
