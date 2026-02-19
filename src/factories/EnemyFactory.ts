import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { AssetLoader, TEX } from "../core/AssetLoader";
import { StraightStrategy } from "../strategies/StraightStrategy";
import { WaveStrategy } from "../strategies/WaveStrategy";
import { BossStrategy } from "../strategies/BossStrategy";

/** 敵タイプごとの定義 */
interface EnemyDef {
  textureKey: string;
  hp: number;
  radius: number;
  score: number;
}

const DEFS: Record<string, EnemyDef> = {
  enemy_red: { textureKey: TEX.ENEMY_RED, hp: 1, radius: 0.02, score: 100 },
  enemy_green: { textureKey: TEX.ENEMY_GREEN, hp: 2, radius: 0.025, score: 200 },
  boss: { textureKey: TEX.BOSS, hp: Boss.MAX_HP, radius: 0.06, score: 3000 },
};

export class EnemyFactory {
  static create(
    enemy: Enemy,
    type: string,
    x: number,
    y: number,
    speed: number,
  ): void {
    let strategy;
    if (type === "boss") {
      strategy = new BossStrategy();
    } else if (type === "enemy_green") {
      strategy = new WaveStrategy(3.0, 0.15);
    } else {
      strategy = new StraightStrategy();
    }

    enemy.init(type, x, y, speed, strategy);

    const def = DEFS[type] ?? DEFS["enemy_red"];
    enemy.hp = def.hp;
    enemy.radius = def.radius;
    enemy.score = def.score;

    // テクスチャ差し替え
    enemy.sprite.texture = AssetLoader.getTexture(def.textureKey);
  }
}
