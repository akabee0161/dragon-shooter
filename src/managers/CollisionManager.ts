import { Bullet } from "../entities/Bullet";
import { Enemy } from "../entities/Enemy";
import { EnemyBullet } from "../entities/EnemyBullet";
import { Player } from "../entities/Player";
import { Game } from "../core/Game";

export interface EnemyKillEvent {
  x: number;
  y: number;
  score: number;
  color: number;
}

export interface PlayerHitEvent {
  x: number;
  y: number;
  died: boolean;
}

const ENEMY_COLORS: Record<string, number> = {
  enemy_red: 0xff4444,
  enemy_green: 0x44ff44,
  enemy_blue: 0x4488ff,
  enemy_purple: 0xaa44ff,
  boss: 0x8833cc,
  boss_stage2: 0xcc2222,
  boss_stage3: 0x22aa66,
};

export interface CollisionResult {
  kills: EnemyKillEvent[];
  playerHit: PlayerHitEvent | null;
}

export class CollisionManager {
  /**
   * 弾vs敵、敵vs自機、敵弾vs自機の衝突判定をまとめて行う。
   */
  static check(
    bullets: Bullet[],
    enemies: Enemy[],
    player: Player,
    enemyBullets?: EnemyBullet[],
  ): CollisionResult {
    const kills: EnemyKillEvent[] = [];
    let playerHit: PlayerHitEvent | null = null;
    const game = Game.current;
    const aspect = game.width / game.height;

    // 1. 弾 vs 敵
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const bullet = bullets[bi];
      if (!bullet.active) continue;

      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const enemy = enemies[ei];
        if (!enemy.active) continue;

        const dx = bullet.x - enemy.x;
        const dy = (bullet.y - enemy.y) * aspect;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bullet.radius + enemy.radius) {
          bullet.deactivate();
          const wasAlive = enemy.hp > 0;
          const dmg = Game.current.difficulty === "easy" ? 2 : 1;
          enemy.takeDamage(dmg);

          if (wasAlive && enemy.hp <= 0) {
            kills.push({
              x: enemy.x,
              y: enemy.y,
              score: enemy.score,
              color: ENEMY_COLORS[enemy.type] ?? 0xffffff,
            });
          }
          break;
        }
      }
    }

    // 2. 敵 vs 自機
    if (player.active && !player.isInvincible) {
      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const dx = player.x - enemy.x;
        const dy = (player.y - enemy.y) * aspect;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + enemy.radius) {
          // ボス以外は接触で破壊
          if (enemy.type !== "boss") {
            enemy.takeDamage(enemy.hp);
            kills.push({
              x: enemy.x,
              y: enemy.y,
              score: 0,
              color: ENEMY_COLORS[enemy.type] ?? 0xffffff,
            });
          }

          const died = player.takeDamage();
          playerHit = { x: player.x, y: player.y, died };
          break;
        }
      }
    }

    // 3. 敵弾 vs 自機
    if (enemyBullets && player.active && !player.isInvincible && !playerHit) {
      for (const eb of enemyBullets) {
        if (!eb.active) continue;

        const dx = player.x - eb.x;
        const dy = (player.y - eb.y) * aspect;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + eb.radius) {
          eb.deactivate();
          const died = player.takeDamage();
          playerHit = { x: player.x, y: player.y, died };
          break;
        }
      }
    }

    return { kills, playerHit };
  }
}
