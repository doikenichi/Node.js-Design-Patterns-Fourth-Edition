import { promisify } from 'node:util'
import { deflateRaw, inflateRaw } from 'node:zlib'
import type {
  MiddlewareMessage,
  ZmqMiddleware,
} from './zmqMiddlewareManager.ts'

const inflateRawAsync = promisify(inflateRaw)
const deflateRawAsync = promisify(deflateRaw)

export function zlibMiddleware(): ZmqMiddleware {
  return {
    inbound(message: MiddlewareMessage): Promise<Buffer> {
      if (!Buffer.isBuffer(message)) {
        throw new TypeError('zlib inbound middleware expects a Buffer')
      }

      return inflateRawAsync(message)
    },
    outbound(message: MiddlewareMessage): Promise<Buffer> {
      if (!Buffer.isBuffer(message)) {
        throw new TypeError('zlib outbound middleware expects a Buffer')
      }

      return deflateRawAsync(message)
    },
  }
}
