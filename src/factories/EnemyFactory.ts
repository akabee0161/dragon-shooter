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
  enemy_red: { textureKey: TEX.ENEMY_RED, hp: 2, radius: 0.02, score: 100 },
  enemy_green: { textureKey: TEX.ENEMY_GREEN, hp: 4, radius: 0.025, score: 200 },
  enemy_blue: { textureKey: TEX.ENEMY_BLUE, hp: 6, radius: 0.022, score: 300 },
  enemy_purple: { textureKey: TEX.ENEMY_PURPLE, hp: 4, radius: 0.018, score: 250 },
  boss: { textureKey: TEX.BOSS, hp: Boss.MAX_HP, radius: 0.06, score: 3000 },
  boss_stage2: { textureKey: TEX.BOSS_STAGE2, hp: 160, radius: 0.06, score: 5000 },
  boss_stage3: { textureKey: TEX.BOSS_STAGE3, hp: 240, radius: 0.06, score: 8000 },
};

/** ボスタイプごとの攻撃パラメータ */
const BOSS_PARAMS: Record<string, { fireCooldown: number; fanWays: number }> = {
  boss: { fireCooldown: 1.0, fanWays: 3 },
  boss_stage2: { fireCooldown: 1.0, fanWays: 3 },
  boss_stage3: { fireCooldown: 0.6, fanWays: 5 },
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
    if (type === "boss" || type === "boss_stage2" || type === "boss_stage3") {
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

    // ボスの攻撃パラメータ設定
    if (enemy instanceof Boss && BOSS_PARAMS[type]) {
      const params = BOSS_PARAMS[type];
      enemy.fireCooldown = params.fireCooldown;
      enemy.fanWays = params.fanWays;
    }
  }
}
