import { readFile, writeFile } from "node:fs/promises";
import type { ConfigData } from "./configData.ts";

export abstract class ConfigTemplate {
  data?: ConfigData;

  async load(filePath: string): Promise<void> {
    console.log(`Deserializing from ${filePath}`);
    this.data = this._deserialize(await readFile(filePath, "utf-8"));
  }

  async save(filePath: string): Promise<void> {
    if (!this.data) {
      throw new Error("No data to save");
    }

    console.log(`Serializing to ${filePath}`);
    await writeFile(filePath, this._serialize(this.data));
  }

  protected abstract _serialize(data: ConfigData): string;

  protected abstract _deserialize(data: string): ConfigData;
}
