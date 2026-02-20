import { Container } from "pixi.js";
import { StageData, WaveEntry } from "../core/AssetLoader";
import { ObjectPool } from "../core/ObjectPool";
import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { ShooterEnemy } from "../entities/ShooterEnemy";
import { ChargerEnemy } from "../entities/ChargerEnemy";
import { EnemyBullet } from "../entities/EnemyBullet";
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

  /** 弾を撃つ通常敵のリスト */
  private shooterEnemies: ShooterEnemy[] = [];

  /** 体当たり敵のリスト */
  private chargerEnemies: ChargerEnemy[] = [];

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

  /** ステージデータを差し替えてリセット */
  loadStage(stageData: StageData): void {
    this.reset();
    this.stageData = stageData;
    this.stageData.waves.sort((a, b) => a.time - b.time);
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

    // 非アクティブ敵をプールに返却（特殊敵は除外）
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const e = this.activeEnemies[i];
      if (
        !e.active &&
        e !== this.boss &&
        !(e instanceof ShooterEnemy) &&
        !(e instanceof ChargerEnemy)
      ) {
        this.enemyPool.release(e);
        this.activeEnemies.splice(i, 1);
      }
    }

    // 非アクティブなシューター敵を除去
    for (let i = this.shooterEnemies.length - 1; i >= 0; i--) {
      const s = this.shooterEnemies[i];
      if (!s.active) {
        const idx = this.activeEnemies.indexOf(s);
        if (idx >= 0) this.activeEnemies.splice(idx, 1);
        this.shooterEnemies.splice(i, 1);
      }
    }

    // 非アクティブなチャージャー敵を除去
    for (let i = this.chargerEnemies.length - 1; i >= 0; i--) {
      const c = this.chargerEnemies[i];
      if (!c.active) {
        const idx = this.activeEnemies.indexOf(c);
        if (idx >= 0) this.activeEnemies.splice(idx, 1);
        this.chargerEnemies.splice(i, 1);
      }
    }
  }

  /** ボスの更新（main.tsから呼ぶ、プレイヤー座標を渡す） */
  updateBoss(delta: number, playerX: number, playerY: number): void {
    if (this.boss && this.boss.active) {
      this.boss.updateBoss(delta, playerX, playerY);
    }

    // シューター敵の弾更新
    for (const shooter of this.shooterEnemies) {
      if (!shooter.active) continue;
      shooter.updateShooter(delta, playerX, playerY);
    }

    // チャージャー敵にプレイヤー座標を渡す
    for (const charger of this.chargerEnemies) {
      if (!charger.active) continue;
      charger.setTarget(playerX, playerY);
    }
  }

  /** 全ての敵弾を収集（ボス＋シューター敵） */
  getAllEnemyBullets(): EnemyBullet[] {
    const bullets: EnemyBullet[] = [];
    if (this.boss) {
      for (const b of this.boss.enemyBullets) {
        bullets.push(b);
      }
    }
    for (const shooter of this.shooterEnemies) {
      for (const b of shooter.enemyBullets) {
        bullets.push(b);
      }
    }
    return bullets;
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
      if (
        enemy !== this.boss &&
        !(enemy instanceof ShooterEnemy) &&
        !(enemy instanceof ChargerEnemy)
      ) {
        this.enemyPool.release(enemy);
      }
    }
    this.activeEnemies.length = 0;

    // シューター敵のクリーンアップ
    for (const shooter of this.shooterEnemies) {
      shooter.clearBullets();
      shooter.deactivate();
    }
    this.shooterEnemies.length = 0;

    // チャージャー敵のクリーンアップ
    this.chargerEnemies.length = 0;

    if (this.boss) {
      this.boss.clearBullets();
      this.boss.deactivate();
      this.boss = null;
    }

    this.elapsed = 0;
    this.waveIndex = 0;
  }

  private spawnEnemy(wave: WaveEntry): void {
    if (wave.type === "boss" || wave.type === "boss_stage2" || wave.type === "boss_stage3") {
      this.spawnBoss(wave);
      return;
    }

    if (wave.type === "enemy_blue") {
      this.spawnShooter(wave);
      return;
    }

    if (wave.type === "enemy_purple") {
      this.spawnCharger(wave);
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

  private spawnShooter(wave: WaveEntry): void {
    const shooter = new ShooterEnemy(this.container);
    EnemyFactory.create(shooter, wave.type, wave.x, wave.y, wave.speed);
    shooter.addToStage(this.container);
    this.activeEnemies.push(shooter);
    this.shooterEnemies.push(shooter);

    console.log(
      `[LevelManager] t=${this.elapsed.toFixed(2)}s — SPAWN SHOOTER "${wave.type}" at (${wave.x}, ${wave.y})`,
    );
  }

  private spawnCharger(wave: WaveEntry): void {
    const charger = new ChargerEnemy();
    EnemyFactory.create(charger, wave.type, wave.x, wave.y, wave.speed);
    charger.addToStage(this.container);
    this.activeEnemies.push(charger);
    this.chargerEnemies.push(charger);

    console.log(
      `[LevelManager] t=${this.elapsed.toFixed(2)}s — SPAWN CHARGER "${wave.type}" at (${wave.x}, ${wave.y})`,
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
