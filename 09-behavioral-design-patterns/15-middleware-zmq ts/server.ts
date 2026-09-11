import zeromq from "zeromq"; // v6.3.0
import { type JsonMessage, jsonMiddleware } from "./jsonMiddleware.ts";
import { zlibMiddleware } from "./zlibMiddleware.ts";
import { ZmqMiddlewareManager } from "./zmqMiddlewareManager.ts";

const socket = new zeromq.Reply();
await socket.bind("tcp://127.0.0.1:5000");

const zmqm = new ZmqMiddlewareManager(socket);
zmqm.use(zlibMiddleware());
zmqm.use(jsonMiddleware());
zmqm.use({
	async inbound(message) {
		const request = message as JsonMessage;
		console.log("Received", request);
		if (request.action === "ping") {
			await this.send({ action: "pong", echo: request.echo });
		}
		return request;
	},
});

console.log("Server started");
