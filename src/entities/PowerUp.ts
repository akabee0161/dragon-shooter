import { Entity } from "./Entity";
import { AssetLoader, TEX } from "../core/AssetLoader";

export class PowerUp extends Entity {
  readonly type: "fireup" | "bomb" | "1up" | "bulletup";
  private readonly speedY = 0.4;

  constructor(type: "fireup" | "bomb" | "1up" | "bulletup") {
    const texKey =
      type === "bomb" ? TEX.ITEM_BOMB
      : type === "1up" ? TEX.ITEM_1UP
      : type === "bulletup" ? TEX.ITEM_BULLETUP
      : TEX.POWER_UP;
    super(AssetLoader.getTexture(texKey));
    this.type = type;
    this.radius = 0.03;
  }

  update(delta: number): void {
    this.y += this.speedY * delta;
    this.syncPosition();

    if (this.y > 1.1) {
      this.deactivate();
    }
  }
}
