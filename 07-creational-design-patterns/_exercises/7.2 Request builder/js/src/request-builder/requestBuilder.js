import {request as httpRequest} from "node:http";
import {once} from "node:events";
import {Readable} from "node:stream";
import {pipeline} from "node:stream/promises";

function validateMethod(method) {
    if (!method) {
        throw new Error("Method is required");
    }
}

function validateHostname(hostname) {
    if (!hostname) {
        throw new Error("Hostname is required");
    }
}

export class RequestBuilder {

    setUrl(url) {
        switch (true) {
            case url instanceof URL:
                this.url = url;
                break;
            case typeof url === "string":
                this.url = new URL(url);
                break;
            default:
                throw new Error("Invalid URL");
        }
        return this;
    }

    setBody(body) {
        this.body = body;
        return this;
    }

    setHostname(hostname) {
        if (typeof hostname !== "string") {
            throw new TypeError("hostname must be a string");
        }
        this.hostname = hostname;
        return this;
    }

    setHeader({name, value}) {
        if (!this.headers) {
            this.headers = {};
        }
        this.headers[name] = value;
        return this;
    }

    addQueryParam({key, value}) {
        if (!this.searchParams) {
            this.searchParams = new URLSearchParams();
        }
        this.searchParams.append(key, value);
        return this;
    }

    setMethod(method) {
        this.method = method;
        return this;
    }

    setProtocol(protocol) {
        if (typeof protocol !== "string") {
            throw new TypeError("protocol must be a string");
        }
        this.protocol = protocol.endsWith(":") ? protocol : protocol + ":";
        return this;
    }

    setPort(port) {
        if (typeof port !== "number") {
            throw new TypeError("port must be a number");
        }
        this.port = port;
        return this;
    }

    setPathname(pathname) {
        this.pathname = pathname;
        return this;
    }

    build() {
        let url;

        if (this.url) {
            // A complete URL is authoritative. Builder-level query parameters
            // are intentionally ignored when setUrl() was used.
            url = new URL(this.url.href);
        } else {
            const hostname = this.hostname;
            const pathname = this.pathname ?? "/";
            const protocol = this.protocol ?? "http:";
            const port = this.port ? `:${this.port}` : "";

            validateHostname(this.hostname);

            url = new URL(`${protocol}//${hostname}${port}${pathname}`);

            // URLSearchParams is internal builder state. http.request() does
            // not accept a searchParams option, so the query is serialized
            // into url.search and returned as part of the request path.
            for (const [key, value] of this.searchParams ?? []) {
                url.searchParams.append(key, value);
            }
        }

        validateMethod(this.method);

        return {
            hostname: url.hostname,
            port: url.port || 80,
            path: `${url.pathname}${url.search}`,
            method: this.method,
            headers: this.headers,
            protocol: url.protocol,
        };

    }

    /**
     * Performs an HTTP request and resolves after the complete response body
     * has been collected. HTTP status codes, including non-2xx codes, are
     * returned as response data; transport and response-stream errors reject.
     * @returns {Promise<{statusCode: *, headers: *, body: string}>}
     */
    async invoke() {
        const options = this.build();
        const req = httpRequest(options);

        // Resolves when the response event occurs.
        // Rejects if the request emits an error first.
        const responsePromise = once(req, "response");

        if (this.body === undefined) {
            req.end();
        } else {
            req.end(this.body);
        }

        const [res] = await responsePromise;

        res.setEncoding("utf8");

        const chunks = [];

        for await (const chunk of res) {
            chunks.push(chunk);
        }

        return {
            statusCode: res.statusCode,
            headers: res.headers,
            body: chunks.join(""),
        };
    }

    /**
     * Optional stream-body variant for learning Node.js pipelines.
     * The body must be a Readable and can only be consumed once.
     * pipeline() ends the request when the body stream finishes.
     * @returns {Promise<{statusCode: *, headers: *, body: string}>}
     */
    async invokeWithPipeline() {
        if (!(this.body instanceof Readable)) {
            throw new TypeError("invokeWithPipeline() requires a Readable body");
        }

        const options = this.build();
        const req = httpRequest(options);

        // Resolves when the response event occurs.
        // Rejects if the request emits an error first.
        const responsePromise = once(req, "response");

        await pipeline(this.body, req);

        const [res] = await responsePromise;

        res.setEncoding("utf8");

        const chunks = [];

        for await (const chunk of res) {
            chunks.push(chunk);
        }

        return {
            statusCode: res.statusCode,
            headers: res.headers,
            body: chunks.join(""),
        };
    }
}

