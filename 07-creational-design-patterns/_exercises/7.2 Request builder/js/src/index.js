import {Readable} from "node:stream";
import {RequestBuilder} from "./request-builder/requestBuilder.js";

const response = await new RequestBuilder()
    // The current builder uses node:http, so use http:// here.
    // Add HTTPS support separately before changing this to https://.
    .setUrl("http://jsonplaceholder.typicode.com/todos/1")
    .setMethod("GET")
    .setHeader({name: "Accept", value: "application/json"})
    .invoke();

console.log(response.statusCode);
console.log(response.headers);
console.log(JSON.parse(response.body));


/**
 * Performs the call with streaming.
 */
const streamBody = Readable.from([
    JSON.stringify({
        title: "Learning Node.js streams",
        body: "This request body is sent through pipeline().",
        userId: 1,
    }),
]);

const streamedResponse = await new RequestBuilder()
    // invokeWithPipeline() requires a Node.js Readable request body.
    .setUrl("http://jsonplaceholder.typicode.com/posts")
    .setMethod("POST")
    .setHeader({name: "Accept", value: "application/json"})
    .setHeader({name: "Content-Type", value: "application/json"})
    .setBody(streamBody)
    .invokeWithPipeline();

console.log(streamedResponse.statusCode);
console.log(JSON.parse(streamedResponse.body));

