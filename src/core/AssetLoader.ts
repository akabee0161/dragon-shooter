import { Application, Graphics, RenderTexture, Texture } from "pixi.js";

export interface StageData {
  id: string;
  waves: WaveEntry[];
}

export interface WaveEntry {
  time: number;
  type: string;
  x: number;
  y: number;
  speed: number;
  dropItem?: "fireup" | "bomb" | "1up" | "bulletup";
}

/** テクスチャキー */
export const TEX = {
  PLAYER: "player",
  BULLET: "bullet",
  ENEMY_RED: "enemy_red",
  ENEMY_GREEN: "enemy_green",
  ENEMY_BLUE: "enemy_blue",
  ENEMY_PURPLE: "enemy_purple",
  ENEMY_BULLET: "enemy_bullet",
  BOSS: "boss",
  BOSS_STAGE2: "boss_stage2",
  BOSS_STAGE3: "boss_stage3",
  BG: "bg",
  POWER_UP: "power_up",
  ITEM_BOMB: "item_bomb",
  ITEM_1UP: "item_1up",
  ITEM_BULLETUP: "item_bulletup",
  BULLET_BLUE: "bullet_blue",
  BULLET_RED: "bullet_red",
  ENEMY_HEAVY: "enemy_heavy",
  BOSS_STAGE4: "boss_stage4",
  BOSS_STAGE5: "boss_stage5",
  ENEMY_SWARM: "enemy_swarm",
} as const;

/** 生成済みテクスチャキャッシュ */
const cache = new Map<string, Texture>();

export class AssetLoader {
  /** ステージJSONを読み込む */
  static async loadStage(path: string): Promise<StageData> {
    const res = await fetch(path);
    return res.json() as Promise<StageData>;
  }

  /** Graphics描画 → RenderTexture でプレースホルダーテクスチャを一括生成 */
  static generateTextures(app: Application): void {
    // プレイヤー (ドラゴン風) 48x48
    const player = new Graphics();
    player.poly([24, 2, 6, 44, 42, 44]).fill(0x44aaff);
    player.poly([6, 30, -8, 44, 14, 36]).fill(0x3388dd);
    player.poly([42, 30, 56, 44, 34, 36]).fill(0x3388dd);
    player.circle(18, 22, 3).fill(0xffffff);
    player.circle(30, 22, 3).fill(0xffffff);
    player.circle(18, 23, 1.5).fill(0x111111);
    player.circle(30, 23, 1.5).fill(0x111111);
    AssetLoader.cacheFromGraphics(app, TEX.PLAYER, player, 48, 48);

    // 弾(黄) 8x20
    const bullet = new Graphics();
    bullet.roundRect(1, 0, 6, 20, 3).fill(0xffff44);
    bullet.roundRect(2, 2, 4, 8, 2).fill(0xffffaa);
    AssetLoader.cacheFromGraphics(app, TEX.BULLET, bullet, 8, 20);

    // 弾(青) 8x20
    const bulletBlue = new Graphics();
    bulletBlue.roundRect(1, 0, 6, 20, 3).fill(0x44aaff);
    bulletBlue.roundRect(2, 2, 4, 8, 2).fill(0xaaddff);
    AssetLoader.cacheFromGraphics(app, TEX.BULLET_BLUE, bulletBlue, 8, 20);

    // 弾(赤) 8x20
    const bulletRed = new Graphics();
    bulletRed.roundRect(1, 0, 6, 20, 3).fill(0xff4444);
    bulletRed.roundRect(2, 2, 4, 8, 2).fill(0xff9999);
    AssetLoader.cacheFromGraphics(app, TEX.BULLET_RED, bulletRed, 8, 20);

    // 敵(赤) 32x32 逆三角形 + 目
    const red = new Graphics();
    red.poly([16, 30, 0, 2, 32, 2]).fill(0xff4444);
    red.circle(11, 12, 3).fill(0xffcccc);
    red.circle(21, 12, 3).fill(0xffcccc);
    red.circle(11, 13, 1.5).fill(0x220000);
    red.circle(21, 13, 1.5).fill(0x220000);
    AssetLoader.cacheFromGraphics(app, TEX.ENEMY_RED, red, 32, 32);

    // 敵(緑) 40x40 丸型 + 目
    const green = new Graphics();
    green.circle(20, 20, 18).fill(0x44ff44);
    green.circle(20, 20, 14).fill(0x33cc33);
    green.circle(14, 16, 3).fill(0xffffff);
    green.circle(26, 16, 3).fill(0xffffff);
    green.circle(14, 17, 1.5).fill(0x002200);
    green.circle(26, 17, 1.5).fill(0x002200);
    AssetLoader.cacheFromGraphics(app, TEX.ENEMY_GREEN, green, 40, 40);

    // 敵(重装) 168x168 六角形（大型高耐久）
    const heavy = new Graphics();
    heavy.poly([84, 6, 156, 48, 156, 120, 84, 162, 12, 120, 12, 48]).fill(0x556677);
    heavy.poly([84, 24, 138, 60, 138, 108, 84, 144, 30, 108, 30, 60]).fill(0x334455);
    heavy.circle(60, 72, 15).fill(0xff4444);
    heavy.circle(108, 72, 15).fill(0xff4444);
    heavy.circle(60, 75, 7.5).fill(0xffff00);
    heavy.circle(108, 75, 7.5).fill(0xffff00);
    AssetLoader.cacheFromGraphics(app, TEX.ENEMY_HEAVY, heavy, 168, 168);

    // 敵(青) 36x36 ダイヤモンド型 + 目（弾を撃つ敵）
    const blue = new Graphics();
    blue.poly([18, 2, 2, 20, 18, 34, 34, 20]).fill(0x4488ff);
    blue.poly([18, 6, 8, 20, 18, 30, 28, 20]).fill(0x3366dd);
    blue.circle(13, 17, 3).fill(0xffffff);
    blue.circle(23, 17, 3).fill(0xffffff);
    blue.circle(13, 18, 1.5).fill(0x000044);
    blue.circle(23, 18, 1.5).fill(0x000044);
    AssetLoader.cacheFromGraphics(app, TEX.ENEMY_BLUE, blue, 36, 36);

    // 敵(紫) 30x30 矢印型（体当たり敵）
    const purple = new Graphics();
    purple.poly([15, 0, 0, 28, 8, 20, 15, 30, 22, 20, 30, 28]).fill(0xaa44ff);
    purple.poly([15, 4, 6, 24, 15, 26, 24, 24]).fill(0x8822dd);
    purple.circle(11, 14, 2.5).fill(0xffccff);
    purple.circle(19, 14, 2.5).fill(0xffccff);
    purple.circle(11, 15, 1.2).fill(0x220022);
    purple.circle(19, 15, 1.2).fill(0x220022);
    AssetLoader.cacheFromGraphics(app, TEX.ENEMY_PURPLE, purple, 30, 30);

    // 敵弾 12x12 (オレンジの丸)
    const eBullet = new Graphics();
    eBullet.circle(6, 6, 5).fill(0xff8800);
    eBullet.circle(6, 6, 3).fill(0xffcc44);
    AssetLoader.cacheFromGraphics(app, TEX.ENEMY_BULLET, eBullet, 12, 12);

    // ボス 96x96 (巨大な紫ドラゴン)
    const boss = new Graphics();
    // 体
    boss.poly([48, 4, 8, 80, 88, 80]).fill(0x8833cc);
    // 翼（左）
    boss.poly([8, 50, -20, 70, 24, 60]).fill(0x6622aa);
    // 翼（右）
    boss.poly([88, 50, 116, 70, 72, 60]).fill(0x6622aa);
    // 腹部
    boss.poly([48, 20, 28, 75, 68, 75]).fill(0xaa55dd);
    // 角（左）
    boss.poly([30, 15, 20, -5, 38, 10]).fill(0xddaa00);
    // 角（右）
    boss.poly([66, 15, 76, -5, 58, 10]).fill(0xddaa00);
    // 目（左）
    boss.circle(36, 35, 6).fill(0xff4444);
    boss.circle(36, 36, 3).fill(0xffff00);
    // 目（右）
    boss.circle(60, 35, 6).fill(0xff4444);
    boss.circle(60, 36, 3).fill(0xffff00);
    AssetLoader.cacheFromGraphics(app, TEX.BOSS, boss, 96, 96);

    // ボス(ステージ2) 96x96 (巨大な紅ドラゴン)
    const boss2 = new Graphics();
    // 体
    boss2.poly([48, 4, 8, 80, 88, 80]).fill(0xcc2222);
    // 翼（左）
    boss2.poly([8, 50, -20, 70, 24, 60]).fill(0xaa1111);
    // 翼（右）
    boss2.poly([88, 50, 116, 70, 72, 60]).fill(0xaa1111);
    // 腹部
    boss2.poly([48, 20, 28, 75, 68, 75]).fill(0xdd5544);
    // 角（左）
    boss2.poly([30, 15, 20, -5, 38, 10]).fill(0xddaa00);
    // 角（右）
    boss2.poly([66, 15, 76, -5, 58, 10]).fill(0xddaa00);
    // 目（左）
    boss2.circle(36, 35, 6).fill(0xffff00);
    boss2.circle(36, 36, 3).fill(0xff0000);
    // 目（右）
    boss2.circle(60, 35, 6).fill(0xffff00);
    boss2.circle(60, 36, 3).fill(0xff0000);
    AssetLoader.cacheFromGraphics(app, TEX.BOSS_STAGE2, boss2, 96, 96);

    // ボス(ステージ3) 96x96 (巨大な翠ドラゴン)
    const boss3 = new Graphics();
    // 体
    boss3.poly([48, 4, 8, 80, 88, 80]).fill(0x22aa66);
    // 翼（左）
    boss3.poly([8, 50, -20, 70, 24, 60]).fill(0x118844);
    // 翼（右）
    boss3.poly([88, 50, 116, 70, 72, 60]).fill(0x118844);
    // 腹部
    boss3.poly([48, 20, 28, 75, 68, 75]).fill(0x44cc88);
    // 角（左）
    boss3.poly([30, 15, 20, -5, 38, 10]).fill(0xccddff);
    // 角（右）
    boss3.poly([66, 15, 76, -5, 58, 10]).fill(0xccddff);
    // 目（左）
    boss3.circle(36, 35, 6).fill(0x00ffff);
    boss3.circle(36, 36, 3).fill(0x004444);
    // 目（右）
    boss3.circle(60, 35, 6).fill(0x00ffff);
    boss3.circle(60, 36, 3).fill(0x004444);
    AssetLoader.cacheFromGraphics(app, TEX.BOSS_STAGE3, boss3, 96, 96);

    // ボス(ステージ4) 96x96 (銀色ドラゴン)
    const boss4 = new Graphics();
    // 体
    boss4.poly([48, 4, 8, 80, 88, 80]).fill(0xaaaaaa);
    // 翼（左）
    boss4.poly([8, 50, -20, 70, 24, 60]).fill(0x888888);
    // 翼（右）
    boss4.poly([88, 50, 116, 70, 72, 60]).fill(0x888888);
    // 腹部
    boss4.poly([48, 20, 28, 75, 68, 75]).fill(0xcccccc);
    // 角（左）
    boss4.poly([30, 15, 20, -5, 38, 10]).fill(0xffffff);
    // 角（右）
    boss4.poly([66, 15, 76, -5, 58, 10]).fill(0xffffff);
    // 目（左）
    boss4.circle(36, 35, 6).fill(0x4466ff);
    boss4.circle(36, 36, 3).fill(0xffffff);
    // 目（右）
    boss4.circle(60, 35, 6).fill(0x4466ff);
    boss4.circle(60, 36, 3).fill(0xffffff);
    AssetLoader.cacheFromGraphics(app, TEX.BOSS_STAGE4, boss4, 96, 96);

    // ボス(ステージ5) 128x128 (黄金ドラゴン - 大型)
    const boss5 = new Graphics();
    // 体（大型三角形）
    boss5.poly([64, 6, 8, 108, 120, 108]).fill(0xffcc00);
    // 翼（左）
    boss5.poly([8, 65, -28, 95, 28, 80]).fill(0xddaa00);
    // 翼（右）
    boss5.poly([120, 65, 156, 95, 100, 80]).fill(0xddaa00);
    // 腹部
    boss5.poly([64, 28, 38, 100, 90, 100]).fill(0xffee88);
    // 角（左）
    boss5.poly([40, 22, 24, -8, 52, 16]).fill(0xffffff);
    // 角（右）
    boss5.poly([88, 22, 104, -8, 76, 16]).fill(0xffffff);
    // 副角（左小）
    boss5.poly([30, 30, 18, 10, 38, 24]).fill(0xeeeeee);
    // 副角（右小）
    boss5.poly([98, 30, 110, 10, 90, 24]).fill(0xeeeeee);
    // 目（左）
    boss5.circle(46, 50, 9).fill(0xff4400);
    boss5.circle(46, 51, 4.5).fill(0xffff00);
    boss5.circle(47, 51, 2).fill(0x000000);
    // 目（右）
    boss5.circle(82, 50, 9).fill(0xff4400);
    boss5.circle(82, 51, 4.5).fill(0xffff00);
    boss5.circle(83, 51, 2).fill(0x000000);
    // 紋章（胸部の模様）
    boss5.circle(64, 70, 8).fill(0xffaa00);
    boss5.circle(64, 70, 4).fill(0xff6600);
    boss5.circle(64, 70, 2).fill(0xffff00);
    AssetLoader.cacheFromGraphics(app, TEX.BOSS_STAGE5, boss5, 128, 128);

    // 敵(群れ) 30x30 炎色の矢印型（隊列突撃敵）
    const swarm = new Graphics();
    swarm.poly([15, 0, 0, 28, 8, 20, 15, 30, 22, 20, 30, 28]).fill(0xff8800);
    swarm.poly([15, 4, 6, 24, 15, 26, 24, 24]).fill(0xffcc00);
    swarm.circle(11, 14, 2.5).fill(0xffeecc);
    swarm.circle(19, 14, 2.5).fill(0xffeecc);
    swarm.circle(11, 15, 1.2).fill(0x220000);
    swarm.circle(19, 15, 1.2).fill(0x220000);
    AssetLoader.cacheFromGraphics(app, TEX.ENEMY_SWARM, swarm, 30, 30);

    // パワーアップアイテム 32x32 (金色オーブ) - fireup
    const powerUpG = new Graphics();
    powerUpG.circle(16, 16, 14).fill(0xffdd00);
    powerUpG.circle(16, 16, 9).fill(0xffff88);
    powerUpG.circle(16, 16, 4).fill(0xffffff);
    AssetLoader.cacheFromGraphics(app, TEX.POWER_UP, powerUpG, 32, 32);

    // ボム補充アイテム 32x32 (赤オーブ)
    const itemBomb = new Graphics();
    itemBomb.circle(16, 16, 14).fill(0xff3333);
    itemBomb.circle(16, 16, 9).fill(0xff8888);
    itemBomb.circle(16, 16, 4).fill(0xffffff);
    AssetLoader.cacheFromGraphics(app, TEX.ITEM_BOMB, itemBomb, 32, 32);

    // 1UPアイテム 32x32 (ピンクオーブ)
    const item1up = new Graphics();
    item1up.circle(16, 16, 14).fill(0xff44aa);
    item1up.circle(16, 16, 9).fill(0xff88cc);
    item1up.circle(16, 16, 4).fill(0xffffff);
    AssetLoader.cacheFromGraphics(app, TEX.ITEM_1UP, item1up, 32, 32);

    // 弾強化アイテム 32x32 (シアンオーブ)
    const itemBulletup = new Graphics();
    itemBulletup.circle(16, 16, 14).fill(0x00ddff);
    itemBulletup.circle(16, 16, 9).fill(0x88eeff);
    itemBulletup.circle(16, 16, 4).fill(0xffffff);
    AssetLoader.cacheFromGraphics(app, TEX.ITEM_BULLETUP, itemBulletup, 32, 32);

    // 背景タイル 64x128 (星空)
    const bg = new Graphics();
    bg.rect(0, 0, 64, 128).fill(0x0a0a1e);
    for (let i = 0; i < 20; i++) {
      const sx = Math.random() * 64;
      const sy = Math.random() * 128;
      const r = 0.5 + Math.random() * 1.5;
      const brightness = 0.3 + Math.random() * 0.7;
      const c = Math.floor(brightness * 255);
      bg.circle(sx, sy, r).fill((c << 16) | (c << 8) | c);
    }
    AssetLoader.cacheFromGraphics(app, TEX.BG, bg, 64, 128);
  }

  static getTexture(key: string): Texture {
    return cache.get(key) ?? Texture.WHITE;
  }

  private static cacheFromGraphics(
    app: Application,
    key: string,
    g: Graphics,
    w: number,
    h: number,
  ): void {
    const rt = RenderTexture.create({ width: w, height: h });
    app.renderer.render({ container: g, target: rt });
    cache.set(key, rt);
  }
}
