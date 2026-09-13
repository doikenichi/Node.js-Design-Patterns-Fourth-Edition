import * as z from 'zod'
export type ConfigData = {
  listen: {
    port: number
    host: string
  }
  timeouts: {
    headersTimeoutMs: number
    keepAliveTimeoutMs: number
    requestTimeoutMs: number
  }
  env: Record<string, string>
}

export const ConfigDataSchema = z.object({
  listen: z.object({
    port: z.number().positive(),
    host: z.string(),
  }),
  timeouts: z.object({
    headersTimeoutMs: z.number().positive(),
    keepAliveTimeoutMs: z.number().positive(),
    requestTimeoutMs: z.number().positive(),
  }),
  env: z.record(z.string(), z.string()),
})
