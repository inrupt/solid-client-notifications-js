/**
 * Copyright 2021 Inrupt Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import IsoWebSocket from "isomorphic-ws";
import { BaseNotificationOptions } from "./notification";
import LiveNotification from "./liveNotification";

export default class WebsocketNotification extends LiveNotification {
  webSocket?: WebSocket;

  constructor(
    topic: string,
    fetchFn: typeof window.fetch,
    options?: BaseNotificationOptions
  ) {
    // Hardcode the protocol to WS to ask the server specifically for a websocket connection
    super(topic, fetchFn, ["ws"], options);
  }

  connect = async (
    providedEndpoint?: string,
    providedSubprotocol?: string
  ): Promise<void> => {
    this.status = "connecting";

    let endpoint = providedEndpoint;
    let subprotocol = providedSubprotocol;

    if (!endpoint) {
      const connectionInfo = await this.fetchNotificationConnectionInfo();
      endpoint = connectionInfo.endpoint;
      subprotocol = connectionInfo.subprotocol;
    }

    // This weirdness handles all of the cases: the global websocket client mock in tests, which
    // uses WebSocket; node.js, which uses IsoWebsocket; and the browser, which uses the global
    // WebSocket. We wouldn't need this except for the fact that the test mock library overrides
    // the global WebSocket.
    // This code right here is why we had to lower test coverage. Maybe someone far cleverer than
    // I can figure out how to get all of this to interoperate.
    const WebsocketConstructor =
      typeof WebSocket !== "undefined" ? WebSocket : IsoWebSocket;

    this.webSocket = new WebsocketConstructor(endpoint, subprotocol);

    // Typescript, for some reason, things this.webSocket can be undefined. It can't. You can
    // see the code just a couple lines up there. It is a mystery.
    /* eslint @typescript-eslint/ban-ts-comment: 0 */
    // @ts-ignore
    this.webSocket.onopen = () => {
      this.status = "connected";
      this.emitter.emit("connected");
    };

    // @ts-ignore
    this.webSocket.onmessage = (e: any) => {
      this.emitter.emit("message", e.data);
    };

    // TODO auto-reconnect once we get a TTL from notification connection info
    // @ts-ignore
    this.webSocket.onclose = () => {
      this.status = "closed";
      this.emitter.emit("closed");
    };

    // @ts-ignore
    this.webSocket.onerror = (e: Event) => {
      this.emitter.emit("error", e);
    };
  };

  disconnect = (): void => {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = undefined;
    }
  };
}
