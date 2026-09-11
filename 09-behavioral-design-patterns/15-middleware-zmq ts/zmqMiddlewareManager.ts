type ZmqSocket = AsyncIterable<Buffer[]> & {
	send(message: Buffer): Promise<void>;
};

export type MiddlewareMessage = unknown;

export type MiddlewareFunction = (
	this: ZmqMiddlewareManager,
	message: MiddlewareMessage,
) => MiddlewareMessage | Promise<MiddlewareMessage>;

export type ZmqMiddleware = {
	inbound?: MiddlewareFunction;
	outbound?: MiddlewareFunction;
};

export class ZmqMiddlewareManager {
	readonly #socket: ZmqSocket;
	readonly #inboundMiddleware: MiddlewareFunction[] = [];
	readonly #outboundMiddleware: MiddlewareFunction[] = [];

	constructor(socket: ZmqSocket) {
		// 1
		this.#socket = socket;
		this.#handleIncomingMessages();
	}

	async #handleIncomingMessages(): Promise<void> {
		// 2
		for await (const [message] of this.#socket) {
			try {
				if (!Buffer.isBuffer(message)) {
					throw new TypeError(
						"Expected the first ZMQ message frame to be a Buffer",
					);
				}

				await this.#executeMiddleware(this.#inboundMiddleware, message);
			} catch (err) {
				console.error("Error while processing the message", err);
			}
		}
	}

	async send(message: MiddlewareMessage): Promise<void> {
		// 3
		const finalMessage = await this.#executeMiddleware(
			this.#outboundMiddleware,
			message,
		);
		if (!Buffer.isBuffer(finalMessage)) {
			throw new TypeError("Outbound middleware must produce a Buffer");
		}

		return this.#socket.send(finalMessage);
	}

	use(middleware: ZmqMiddleware): void {
		// 4
		if (middleware.inbound) {
			this.#inboundMiddleware.push(middleware.inbound);
		}
		if (middleware.outbound) {
			this.#outboundMiddleware.unshift(middleware.outbound);
		}
	}

	async #executeMiddleware(
		middlewares: MiddlewareFunction[],
		initialMessage: MiddlewareMessage,
	): Promise<MiddlewareMessage> {
		// 5
		let message = initialMessage;
		for (const middlewareFunc of middlewares) {
			message = await middlewareFunc.call(this, message);
		}
		return message;
	}
}
