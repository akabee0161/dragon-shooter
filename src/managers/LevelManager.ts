import { Container } from "pixi.js";
import { StageData, WaveEntry } from "../core/AssetLoader";
import { ObjectPool } from "../core/ObjectPool";
import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { EnemyFactory } from "../factories/EnemyFactory";

/**
 * ステージJSONを解釈し、時間経過で敵をSpawnする。
 * 画面外に出た敵はプールに返却される。
 */
export class LevelManager {
  private stageData: StageData;
  private elapsed = 0;
  private waveIndex = 0;
  private container: Container;

  private enemyPool: ObjectPool<Enemy>;
  readonly activeEnemies: Enemy[] = [];

  /** 現在のボス（存在する場合） */
  boss: Boss | null = null;

  /** ボス出現コールバック */
  onBossSpawn: (() => void) | null = null;
  /** ボス撃破コールバック */
  onBossDefeat: (() => void) | null = null;

  constructor(stageData: StageData, container: Container) {
    this.stageData = stageData;
    this.container = container;

    this.stageData.waves.sort((a, b) => a.time - b.time);

    this.enemyPool = new ObjectPool<Enemy>(
      () => new Enemy(),
      () => {},
      20,
    );

    console.log(
      `[LevelManager] Stage "${stageData.id}" loaded — ${stageData.waves.length} waves`,
    );
  }

  update(delta: number): void {
    this.elapsed += delta;

    // 時間経過で敵をスポーン
    while (
      this.waveIndex < this.stageData.waves.length &&
      this.elapsed >= this.stageData.waves[this.waveIndex].time
    ) {
      this.spawnEnemy(this.stageData.waves[this.waveIndex]);
      this.waveIndex++;
    }

    // 敵の更新
    for (const enemy of this.activeEnemies) {
      if (!enemy.active) continue;
      enemy.update(delta);
    }

    // 非アクティブ敵をプールに返却（ボスは除外）
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const e = this.activeEnemies[i];
      if (!e.active && e !== this.boss) {
        this.enemyPool.release(e);
        this.activeEnemies.splice(i, 1);
      }
    }
  }

  /** ボスの更新（main.tsから呼ぶ、プレイヤー座標を渡す） */
  updateBoss(delta: number, playerX: number, playerY: number): void {
    if (!this.boss || !this.boss.active) return;
    this.boss.updateBoss(delta, playerX, playerY);
  }

  /** ボスが撃破されたか確認 */
  checkBossDefeat(): boolean {
    if (this.boss && !this.boss.active) {
      const b = this.boss;
      this.boss = null;
      // activeEnemiesから除去
      const idx = this.activeEnemies.indexOf(b);
      if (idx >= 0) this.activeEnemies.splice(idx, 1);
      if (this.onBossDefeat) this.onBossDefeat();
      return true;
    }
    return false;
  }

  get isComplete(): boolean {
    return (
      this.waveIndex >= this.stageData.waves.length &&
      this.activeEnemies.length === 0 &&
      this.boss === null
    );
  }

  /** ステージデータを切り替えてリセットする */
  loadStage(stageData: StageData): void {
    this.stageData = stageData;
    this.stageData.waves.sort((a, b) => a.time - b.time);
    this.reset();
    console.log(
      `[LevelManager] Stage "${stageData.id}" loaded — ${stageData.waves.length} waves`,
    );
  }

  /** 全ての敵をプールに返却し、タイマーをリセット */
  reset(): void {
    for (const enemy of this.activeEnemies) {
      enemy.deactivate();
      if (enemy !== this.boss) {
        this.enemyPool.release(enemy);
      }
    }
    this.activeEnemies.length = 0;

    if (this.boss) {
      this.boss.clearBullets();
      this.boss.deactivate();
      this.boss = null;
    }

    this.elapsed = 0;
    this.waveIndex = 0;
  }

  private spawnEnemy(wave: WaveEntry): void {
    if (wave.type === "boss") {
      this.spawnBoss(wave);
      return;
    }

    const enemy = this.enemyPool.acquire();
    EnemyFactory.create(enemy, wave.type, wave.x, wave.y, wave.speed);
    enemy.addToStage(this.container);
    this.activeEnemies.push(enemy);

    console.log(
      `[LevelManager] t=${this.elapsed.toFixed(2)}s — SPAWN "${wave.type}" at (${wave.x}, ${wave.y})`,
    );
  }

  private spawnBoss(wave: WaveEntry): void {
    const boss = new Boss(this.container);
    EnemyFactory.create(boss, wave.type, wave.x, wave.y, wave.speed);
    boss.addToStage(this.container);
    this.activeEnemies.push(boss);
    this.boss = boss;

    if (this.onBossSpawn) this.onBossSpawn();

    console.log(
      `[LevelManager] t=${this.elapsed.toFixed(2)}s — BOSS SPAWNED!`,
    );
  }
}
