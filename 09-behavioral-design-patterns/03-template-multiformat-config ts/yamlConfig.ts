import YAML from "yaml"; // v2.7.0
import { parseConfigData } from "./configData.ts";
import type { ConfigData } from "./configData.ts";
import { ConfigTemplate } from "./configTemplate.ts";

export class YamlConfig extends ConfigTemplate {
  protected override _deserialize(data: string): ConfigData {
    return parseConfigData(YAML.parse(data));
  }

  protected override _serialize(data: ConfigData): string {
    return YAML.stringify(data, { indent: 2 });
  }
}
