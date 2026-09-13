import type { ConfigData } from './configData.ts'
import { parseConfigData } from './configData.ts'
import { ConfigTemplate } from './configTemplate.ts'

export class JsonConfig extends ConfigTemplate {
  protected override _deserialize(data: string): ConfigData {
    return parseConfigData(JSON.parse(data))
  }

  protected override _serialize(data: ConfigData): string {
    return JSON.stringify(data, null, 2)
  }
}
