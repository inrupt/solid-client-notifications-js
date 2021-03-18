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

import { UrlString } from "@inrupt/solid-client";

import { BaseNotificationOptions } from "./notification";
import LiveNotification from "./liveNotification";

export default class WebsocketNotification extends LiveNotification {
  webSocket?: WebSocket;

  constructor(
    topic: UrlString,
    fetchFn: typeof window.fetch,
    options?: BaseNotificationOptions
  ) {
    // Hardcode the protocol to WS to ask the server specifically for a websocket connection
    super(topic, fetchFn, ["ws"], options);
  }

  connect = async (
    providedEndpoint?: UrlString,
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

    this.webSocket = new WebSocket(endpoint, subprotocol);

    this.webSocket.onopen = () => {
      this.status = "connected";
      this.emitter.emit("connected");
    };

    this.webSocket.onmessage = (e) => {
      this.emitter.emit("message", e.data);
    };

    // TODO auto-reconnect once we get a TTL from notification connection info
    this.webSocket.onclose = () => {
      this.status = "closed";
      this.emitter.emit("closed");
    };

    this.webSocket.onerror = (error) => {
      this.emitter.emit("error", error);
    };
  };

  disconnect = (): void => {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = undefined;
    }
  };
}
