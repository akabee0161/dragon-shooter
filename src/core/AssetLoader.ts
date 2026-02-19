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
}

/** テクスチャキー */
export const TEX = {
  PLAYER: "player",
  BULLET: "bullet",
  ENEMY_RED: "enemy_red",
  ENEMY_GREEN: "enemy_green",
  ENEMY_BULLET: "enemy_bullet",
  BOSS: "boss",
  BG: "bg",
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

    // 弾 8x20
    const bullet = new Graphics();
    bullet.roundRect(1, 0, 6, 20, 3).fill(0xffff44);
    bullet.roundRect(2, 2, 4, 8, 2).fill(0xffffaa);
    AssetLoader.cacheFromGraphics(app, TEX.BULLET, bullet, 8, 20);

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
