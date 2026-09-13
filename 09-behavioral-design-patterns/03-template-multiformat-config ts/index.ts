import { join } from 'node:path'
import type { ConfigTemplate } from './configTemplate.ts'
import { JsonConfig } from './jsonConfig.ts'
import { TomlConfig } from './tomlConfig.ts'
import { YamlConfig } from './yamlConfig.ts'

const SAMPLES = join(import.meta.dirname, 'samples')

function updateEnvironment(config: ConfigTemplate): void {
  if (!config.data) {
    throw new Error('No data loaded')
  }

  config.data.env.NODE_ENV = 'production'
  config.data.env.NODE_OPTIONS = '--enable-source-maps'
}

const jsonConfig = new JsonConfig()
await jsonConfig.load(join(SAMPLES, 'config.json'))
updateEnvironment(jsonConfig)
await jsonConfig.save(join(SAMPLES, 'config_mod.json'))

const yamlConfig = new YamlConfig()
await yamlConfig.load(join(SAMPLES, 'config.yaml'))
updateEnvironment(yamlConfig)
await yamlConfig.save(join(SAMPLES, 'config_mod.yaml'))

const tomlConfig = new TomlConfig()
await tomlConfig.load(join(SAMPLES, 'config.toml'))
updateEnvironment(tomlConfig)
await tomlConfig.save(join(SAMPLES, 'config_mod.toml'))
