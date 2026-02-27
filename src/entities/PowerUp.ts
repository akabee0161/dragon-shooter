import { Entity } from "./Entity";
import { AssetLoader, TEX } from "../core/AssetLoader";

export class PowerUp extends Entity {
  private readonly speedY = 0.2;

  constructor() {
    super(AssetLoader.getTexture(TEX.POWER_UP));
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
