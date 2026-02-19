import { Texture } from "pixi.js";
import { Entity } from "./Entity";
import type { IMovementStrategy } from "../strategies/IMovementStrategy";
import { Enemy } from "./Enemy";

/**
 * 自機に向かって高速で体当たりしてくる敵。
 * 出現後、少し降下してからプレイヤー方向にロックオンして突進する。
 */
export class ChargerEnemy extends Enemy {
  /** 突進速度 */
  chargeSpeed = 0.8;

  /** 突進前の待機フェーズか */
  private charging = false;

  /** ロックオンした角度 */
  private chargeAngle = 0;

  /** 降下してからロックオンするまでの待機Y座標 */
  private lockOnY = 0.15;

  /** プレイヤー座標（LevelManagerから毎フレーム受け取る） */
  private targetX = 0.5;
  private targetY = 0.8;

  isCharger = true;

  constructor() {
    super();
  }

  /** プレイヤー座標を設定（LevelManagerから呼ぶ） */
  setTarget(playerX: number, playerY: number): void {
    this.targetX = playerX;
    this.targetY = playerY;
  }

  override update(delta: number): void {
    if (!this.charging) {
      // フェーズ1: ゆっくり降下
      this.y += this.speed * delta;

      if (this.y >= this.lockOnY) {
        // ロックオン → 突進開始
        this.charging = true;
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.chargeAngle = Math.atan2(dy, dx);
      }
    } else {
      // フェーズ2: ロックオン方向に高速突進
      this.x += Math.cos(this.chargeAngle) * this.chargeSpeed * delta;
      this.y += Math.sin(this.chargeAngle) * this.chargeSpeed * delta;
    }

    this.syncPosition();

    // 画面外に出たら非アクティブ
    if (this.y > 1.15 || this.y < -0.15 || this.x < -0.15 || this.x > 1.15) {
      this.deactivate();
    }
  }
}
