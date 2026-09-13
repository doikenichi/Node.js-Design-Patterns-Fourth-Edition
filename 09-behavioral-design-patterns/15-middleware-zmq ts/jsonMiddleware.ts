import type {
  MiddlewareMessage,
  ZmqMiddleware,
} from './zmqMiddlewareManager.ts'

export type JsonMessage = Record<string, unknown>

export function jsonMiddleware(): ZmqMiddleware {
  return {
    inbound(message: MiddlewareMessage): JsonMessage {
      if (!Buffer.isBuffer(message)) {
        throw new TypeError('JSON inbound middleware expects a Buffer')
      }

      const parsedMessage = JSON.parse(message.toString()) as unknown
      if (
        typeof parsedMessage !== 'object' ||
        parsedMessage === null ||
        Array.isArray(parsedMessage)
      ) {
        throw new TypeError('JSON inbound middleware expects a JSON object')
      }

      return parsedMessage as JsonMessage
    },
    outbound(message: MiddlewareMessage): Buffer {
      return Buffer.from(JSON.stringify(message))
    },
  }
}
