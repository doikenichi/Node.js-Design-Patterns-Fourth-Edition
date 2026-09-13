import zeromq from 'zeromq' // v6.3.0
import { jsonMiddleware } from './jsonMiddleware.ts'
import { zlibMiddleware } from './zlibMiddleware.ts'
import { ZmqMiddlewareManager } from './zmqMiddlewareManager.ts'

const socket = new zeromq.Request()
await socket.connect('tcp://127.0.0.1:5000')

const zmqm = new ZmqMiddlewareManager(socket)
zmqm.use(zlibMiddleware())
zmqm.use(jsonMiddleware())
zmqm.use({
  inbound(message) {
    console.log('Echoed back', message)
    return message
  },
})

setInterval(() => {
  zmqm
    .send({ action: 'ping', echo: Date.now() })
    .catch((err: unknown) => console.error(err))
}, 1000)

console.log('Client connected')
