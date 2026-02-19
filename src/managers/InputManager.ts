import { Game } from "../core/Game";
import { Player } from "../entities/Player";

export class InputManager {
  private player: Player;
  private dragging = false;
  /** タッチ開始時のオフセット（指とプレイヤーのずれを保持） */
  private offsetX = 0;
  private offsetY = 0;

  constructor(player: Player) {
    this.player = player;
  }

  bind(): void {
    const canvas = Game.current.app.canvas;

    // タッチイベント
    canvas.addEventListener("touchstart", (e) => this.onPointerDown(e.touches[0]), { passive: false });
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      this.onPointerMove(e.touches[0]);
    }, { passive: false });
    canvas.addEventListener("touchend", () => this.onPointerUp());

    // マウスイベント（PC開発用）
    canvas.addEventListener("mousedown", (e) => this.onPointerDown(e));
    canvas.addEventListener("mousemove", (e) => this.onPointerMove(e));
    canvas.addEventListener("mouseup", () => this.onPointerUp());
  }

  private onPointerDown(e: { clientX: number; clientY: number }): void {
    this.dragging = true;
    const game = Game.current;
    const normX = game.toNormX(e.clientX);
    const normY = game.toNormY(e.clientY);
    this.offsetX = this.player.x - normX;
    this.offsetY = this.player.y - normY;
  }

  private onPointerMove(e: { clientX: number; clientY: number }): void {
    if (!this.dragging) return;
    const game = Game.current;
    const normX = game.toNormX(e.clientX);
    const normY = game.toNormY(e.clientY);
    this.player.moveTo(normX + this.offsetX, normY + this.offsetY);
  }

  private onPointerUp(): void {
    this.dragging = false;
  }
}
