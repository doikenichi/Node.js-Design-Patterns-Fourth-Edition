import TOML from 'smol-toml' // v1.3.1
import type { ConfigData } from './configData.ts'
import { parseConfigData } from './configData.ts'
import { ConfigTemplate } from './configTemplate.ts'

export class TomlConfig extends ConfigTemplate {
  protected override _deserialize(data: string): ConfigData {
    return parseConfigData(TOML.parse(data))
  }

  protected override _serialize(data: ConfigData): string {
    return TOML.stringify(data)
  }
}
