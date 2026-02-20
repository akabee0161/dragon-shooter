import { Game } from "./core/Game";
import { AssetLoader } from "./core/AssetLoader";
import { Background } from "./core/Background";
import { Player } from "./entities/Player";
import { Boss } from "./entities/Boss";
import { InputManager } from "./managers/InputManager";
import { LevelManager } from "./managers/LevelManager";
import { CollisionManager } from "./managers/CollisionManager";
import { EffectManager } from "./managers/EffectManager";
import { AudioManager } from "./managers/AudioManager";
import { GameUI } from "./ui/GameUI";
import { TitleScene } from "./scenes/TitleScene";

async function main() {
  // ゲーム初期化
  const game = new Game();
  await game.init();

  // プレースホルダーテクスチャ生成
  AssetLoader.generateTextures(game.app);

  // ステージデータ読み込み
  const stageDataList = await Promise.all([
    AssetLoader.loadStage(`${import.meta.env.BASE_URL}src/assets/levels/stage1.json`),
    AssetLoader.loadStage(`${import.meta.env.BASE_URL}src/assets/levels/stage2.json`),
  ]);
  let currentStageIndex = 0;

  // --- タイトル画面 ---
  const titleScene = new TitleScene();
  game.app.stage.addChild(titleScene.container);

  // --- ゲーム画面（初期非表示） ---
  game.gameContainer.visible = false;

  // 背景
  const bg = new Background(game.gameContainer);

  // プレイヤー生成
  const player = new Player(game.gameContainer);
  player.addToStage(game.gameContainer);

  // 入力管理
  const input = new InputManager(player);
  input.bind();

  // レベル管理
  const levelManager = new LevelManager(stageDataList[0], game.gameContainer);

  // エフェクト管理
  const effectManager = new EffectManager(game.gameContainer);

  // UI
  const gameUI = new GameUI(game.app.stage);
  gameUI.updateHP(player.hp);

  // 初期状態ではUI非表示
  gameUI.setVisible(false);

  // ボス出現時のコールバック
  levelManager.onBossSpawn = () => {
    gameUI.showBossBar();
  };

  // ボス撃破時のコールバック
  levelManager.onBossDefeat = () => {
    gameUI.hideBossBar();
    gameUI.addScore(3000);
    effectManager.spawnExplosion(0.5, 0.15, 0x8833cc);
    effectManager.spawnExplosion(0.45, 0.18, 0xff4444);
    effectManager.spawnExplosion(0.55, 0.12, 0xffaa00);
    AudioManager.current.playSE("explosion");
    game.shake(20, 1.0);

    if (currentStageIndex < stageDataList.length - 1) {
      // 次のステージへ遷移（HP引き継ぎ）
      setTimeout(() => {
        currentStageIndex++;
        player.clearBullets();
        levelManager.loadStage(stageDataList[currentStageIndex]);
        effectManager.reset();
      }, 1500);
    } else {
      // 最終ステージクリア
      setTimeout(() => {
        game.state = "gameclear";
        gameUI.showGameClear();
      }, 500);
    }
  };

  // リトライ処理（HP完全リセット、ステージ1から再開）
  const resetGame = () => {
    currentStageIndex = 0;
    player.clearBullets();
    player.reset();
    levelManager.loadStage(stageDataList[0]);
    effectManager.reset();
    gameUI.resetScore();
    gameUI.hideGameOver();
    gameUI.hideBossBar();
    gameUI.updateHP(player.hp);
    gameUI.updateBombs(player.bombs);
    game.state = "playing";
  };
  gameUI.setOnRetry(resetGame);

  // ボム発動処理
  const activateBomb = () => {
    if (game.state !== "playing") return;
    if (!player.useBomb()) return;

    // 通常敵を全滅（ボス以外）
    for (const enemy of levelManager.activeEnemies) {
      if (!enemy.active || enemy === levelManager.boss) continue;
      gameUI.addScore(enemy.score);
      effectManager.spawnExplosion(enemy.x, enemy.y, 0xff4400);
      enemy.deactivate();
    }

    // ボスに10ダメージ
    if (levelManager.boss) {
      levelManager.boss.takeDamage(10);
    }

    // 演出
    gameUI.showBombFlash();
    effectManager.spawnBombExplosions();
    AudioManager.current.playSE("explosion");
    game.shake(15, 0.8);

    gameUI.updateBombs(player.bombs);
  };
  gameUI.setOnBomb(activateBomb);

  // キーボード 'Z' でボム発動
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyZ") activateBomb();
  });

  // タイトル → ゲーム開始
  titleScene.setOnStart(() => {
    titleScene.hide();
    game.gameContainer.visible = true;
    gameUI.setVisible(true);
    resetGame();
  });

  // ゲームループ
  game.app.ticker.add((ticker) => {
    const delta = ticker.deltaTime / 60;

    // 背景は常にスクロール
    bg.update(delta);

    // シェイク更新
    game.updateShake(delta);

    gameUI.update(delta);

    if (game.state !== "playing") {
      effectManager.update(delta);
      return;
    }

    if (!game.gameContainer.visible) return;

    player.update(delta);
    levelManager.update(delta);

    // ボスの更新（敵弾発射含む）
    levelManager.updateBoss(delta, player.x, player.y);

    // ボスHPバー更新
    if (levelManager.boss) {
      gameUI.updateBossBar(levelManager.boss.hp / Boss.MAX_HP);
    }

    // 敵弾の収集（ボスが存在する場合）
    const enemyBullets = levelManager.boss?.enemyBullets;

    // 当たり判定
    const result = CollisionManager.check(
      player.bullets,
      levelManager.activeEnemies,
      player,
      enemyBullets,
    );

    // 敵撃破イベント
    for (const kill of result.kills) {
      if (kill.score > 0) {
        gameUI.addScore(kill.score);
      }
      effectManager.spawnExplosion(kill.x, kill.y, kill.color);
      AudioManager.current.playSE("explosion");
    }

    // ボス撃破チェック
    levelManager.checkBossDefeat();

    // プレイヤー被弾イベント
    if (result.playerHit) {
      gameUI.updateHP(player.hp);
      game.shake(8, 0.3);

      if (result.playerHit.died) {
        effectManager.spawnExplosion(player.x, player.y, 0x44aaff);
        AudioManager.current.playSE("explosion");
        game.shake(15, 0.6);
        game.state = "gameover";
        gameUI.showGameOver();
      }
    }

    effectManager.update(delta);
  });
}

main().catch(console.error);
