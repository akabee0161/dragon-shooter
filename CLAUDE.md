# Shooting Game — プロジェクトコンテキスト

## 技術スタック
- **フレームワーク**: PixiJS v8（WebGL/WebGPU レンダラ）
- **言語**: TypeScript
- **ビルド**: Vite（`import.meta.env.BASE_URL` でアセットパス解決）
- **実行**: `npx tsc --noEmit` で型チェック可能

## ディレクトリ構成

```
src/
  core/
    AssetLoader.ts   テクスチャ生成・ステージJSON読み込み・TEX定数
    Game.ts          アプリ本体・座標変換(toPixelX/Y)・shake・state管理
    ObjectPool.ts    汎用オブジェクトプール
    Background.ts    背景スクロール
  entities/
    Entity.ts          基底クラス（正規化座標、sprite、active フラグ）
    Enemy.ts           通常敵（strategy パターンで移動）
    Boss.ts            ボス（updateBoss で弾発射）
    ShooterEnemy.ts    弾を撃つ敵（enemyBullets 保持）
    ChargerEnemy.ts    体当たり敵（降下→ロックオン→突進）
    FormationChargerEnemy.ts  隊列突撃敵（waitDelay後にChargerと同動作）
    Player.ts
    Bullet.ts
    EnemyBullet.ts
    PowerUp.ts
  strategies/
    IMovementStrategy.ts
    StraightStrategy.ts
    WaveStrategy.ts      サイン波横移動（enemy_green 用）
    BossStrategy.ts      ボス1〜3共通
    BossStage4Strategy.ts ステージ4ボス専用
  factories/
    EnemyFactory.ts  敵タイプ→HP/radius/score/テクスチャ/strategy を設定
  managers/
    LevelManager.ts  ステージJSON解釈・敵スポーン・プール管理
    CollisionManager.ts
    EffectManager.ts
    InputManager.ts
    AudioManager.ts
  scenes/
    TitleScene.ts
  ui/
    GameUI.ts
  main.ts            ゲームループ・ステージ遷移・ボム処理

public/assets/levels/
  stage1.json 〜 stage5.json
```

## 座標系
- 正規化座標 (0.0〜1.0) で管理、`Game.toPixelX/Y` でピクセル変換
- y が負 = 画面上方（スポーン位置は y: -0.1 など）
- y > 1.15 等で画面外判定 → `deactivate()`

## 敵タイプ一覧

| type | クラス | 特徴 |
|---|---|---|
| `enemy_red` | Enemy | 直線降下、HP:2 |
| `enemy_green` | Enemy | サイン波移動、HP:4 |
| `enemy_blue` | ShooterEnemy | 弾を撃つ、HP:6 |
| `enemy_purple` | ChargerEnemy | 体当たり突進、HP:4 |
| `enemy_heavy` | Enemy | 超高耐久、HP:150 |
| `formation_charger_left` | FormationChargerEnemy | 10体隊列突撃（左から順）、HP:3 |
| `formation_charger_right` | FormationChargerEnemy | 10体隊列突撃（右から順）、HP:3 |
| `formation_charger` | FormationChargerEnemy | 上記 left の別名（後方互換） |
| `boss` | Boss | ステージ1ボス |
| `boss_stage2` | Boss | ステージ2ボス |
| `boss_stage3` | Boss | ステージ3ボス |
| `boss_stage4` | Boss | ステージ4・5ボス |

## LevelManager の特殊敵管理パターン
通常敵は `enemyPool`（ObjectPool）で使い回す。特殊敵は個別配列で管理し、プールへ返却しない。

```
activeEnemies[]         ← 全敵（衝突判定用）
shooterEnemies[]        ← ShooterEnemy（弾発射・setTarget不要）
chargerEnemies[]        ← ChargerEnemy（setTarget毎フレーム）
formationChargerEnemies[] ← FormationChargerEnemy（setTarget毎フレーム）
boss                    ← Boss（updateBoss毎フレーム）
```

新しい特殊敵を追加する際は:
1. `activeEnemies` プール返却条件に `instanceof` 除外を追加
2. 専用配列でクリーンアップ（`update`・`reset`）
3. `updateBoss` でプレイヤー座標を渡す処理を追加

## EnemyFactory の拡張方法
`DEFS` に追加 → `spawnEnemy` に分岐 → 必要なら専用 `strategy` を `create()` 内で設定。

## テクスチャの追加方法
1. `AssetLoader.ts` の `TEX` 定数に追加
2. `generateTextures()` 内で `Graphics` 描画 → `cacheFromGraphics()`
3. `EnemyFactory.ts` の DEFS でキーを参照

## ステージ設計

### ステージ構成（stage*.json）
```json
{ "id": "stage_N", "waves": [
  { "time": <秒>, "type": "<敵タイプ>", "x": 0.0~1.0, "y": -0.1, "speed": <正規化速度>, "dropItem": "fireup|bomb|1up|bulletup" }
]}
```
- `time` は経過秒（ソート済みで処理される）
- `dropItem` はオプション

### 各ステージのボス
| ステージ | ボスtype | HP | fanWays | fireCooldown |
|---|---|---|---|---|
| 1 | `boss` | 50 | 3 | 1.0s |
| 2 | `boss_stage2` | 160 | 3 | 1.0s |
| 3 | `boss_stage3` | 240 | 5 | 0.6s |
| 4 | `boss_stage4` | 350 | 7 | 0.5s |
| 5 | `boss_stage5` | 500 | 9 | 0.4s |

### ステージ5の構成（41秒）
- 1.0s: 赤4体
- 3.5s: 重装1体 (bulletup)
- **5.5s: 隊列突撃 speed=0.3**
- 9.5s: 緑3体
- 11.0s: 青2体 (fireup)
- 12.5s: 重装2体
- **15.0s: 隊列突撃 speed=0.35**
- 19.5s: 紫4体
- 20.5s: 赤2体
- 22.0s: 重装3体 (1up)
- 24.0s: 青1体
- **25.5s: 隊列突撃 speed=0.40**
- 30.5s: 紫3体
- 31.5s: 青2体 (bomb)
- 33.0s: 重装2体
- 41.0s: boss_stage4

## FormationChargerEnemy の動作仕様
- `waitDelay` 秒間は初期 x,y に静止（隊列保持）
- 待機後: 降下 → y=0.15 でプレイヤー方向にロックオン → 速度 0.95 で突進
- 10体が x=0.05〜0.95 の等間隔、0.45秒ずつずれて順番に突進
- LevelManager.spawnFormation() が1エントリで10体を一括スポーン

## アイテム種別
| dropItem | 効果 |
|---|---|
| `fireup` | 弾威力アップ（player.powerUp()） |
| `bomb` | ボム+1（MAX_BOMBS まで） |
| `1up` | HP+1（MAX_HP まで） |
| `bulletup` | 弾数アップ（player.bulletUp()） |

## ゲーム状態管理
`game.state`: `"playing"` | `"loading"` | `"gameover"` | `"gameclear"`

## 注意点・既知の設計
- `Boss.MAX_HP` は static 定数（ステージ1ボス用）
- ステージ遷移時は HP・ボム・スコアを引き継ぎ、弾だけクリア
- リトライ時はステージ1から完全リセット
- ボスの難易度は `fireCooldown` と `fanWays` で制御

## ブランチとプレビュー
- 機能ブランチから `develop` への PR を最初に作る。`develop` にマージすると、Cloudflare Access の受付の後ろに確認用のプレビューが固定の URL に自動で上がる（`.github/workflows/preview.yml`）
- 本番に出すときは、`develop` から `main` への PR をマージする（`deploy.yml` が本番に出す）
- `preview.yml` は `develop` への push だけで動き、`wrangler deploy` は書かない。`wrangler.toml` の `preview_urls = true` は確認用プレビューのためで、本番の `workers.dev` は開かない
- このリポジトリにはテストがないため、`preview.yml` は共通のひな形から `npm test` の 1 行だけを除いている（`deploy.yml` と同じ手順）
- `develop` ができるまでの最初の PR（プレビューの導入そのもの）だけは `main` に向ける
