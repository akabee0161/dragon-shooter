import { Texture } from "pixi.js";
import { Entity } from "./Entity";
import type { IMovementStrategy } from "../strategies/IMovementStrategy";

export class Enemy extends Entity {
  /** 正規化座標での毎秒移動量（Strategyから参照される） */
  speed = 0.3;
  type = "enemy_red";
  /** 体力 */
  hp = 1;
  /** 撃破時のスコア */
  score = 100;
  /** 撃破時にアイテムを落とすか */
  drop = false;

  /** WaveStrategy用：出現時のX座標を保持 */
  originX = 0;

  private strategy!: IMovementStrategy;

  constructor() {
    super(Texture.WHITE);
  }

  /** Factoryから呼ばれる初期化メソッド */
  init(
    type: string,
    x: number,
    y: number,
    speed: number,
    strategy: IMovementStrategy,
  ): void {
    this.type = type;
    this.x = x;
    this.y = y;
    this.originX = x;
    this.speed = speed;
    this.strategy = strategy;
    this.active = true;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.deactivate();
    }
  }

  update(delta: number): void {
    this.strategy.update(this, delta);
    this.syncPosition();

    if (this.y > 1.15) {
      this.deactivate();
    }
  }
}
