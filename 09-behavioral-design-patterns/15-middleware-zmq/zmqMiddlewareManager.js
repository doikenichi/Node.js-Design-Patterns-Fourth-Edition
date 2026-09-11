export class ZmqMiddlewareManager {
  #socket;
  #inboundMiddleware = [];
  #outboundMiddleware = [];

  constructor(socket) {
    // 1
    this.#socket = socket;
    this.#handleIncomingMessages();
  }

  async #handleIncomingMessages() {
    // 2
    for await (const [message] of this.#socket) {
      // await this.#executeMiddleware(this.#inboundMiddleware, message).catch(
      //   err => {
      //     console.error('Error while processing the message', err)
      //   }
      // )
      try {
        await this.#executeMiddleware(this.#inboundMiddleware, message);
      } catch (err) {
        console.error("Error while processing the message", err);
      }
    }
  }

  async send(message) {
    // 3
    const finalMessage = await this.#executeMiddleware(
      this.#outboundMiddleware,
      message,
    );
    return this.#socket.send(finalMessage);
  }

  use(middleware) {
    // 4
    if (middleware.inbound) {
      this.#inboundMiddleware.push(middleware.inbound);
    }
    if (middleware.outbound) {
      this.#outboundMiddleware.unshift(middleware.outbound);
    }
  }

  async #executeMiddleware(middlewares, initialMessage) {
    //5
    let message = initialMessage;
    for await (const middlewareFunc of middlewares) {
      message = await middlewareFunc.call(this, message);
    }
    return message;
  }
}
