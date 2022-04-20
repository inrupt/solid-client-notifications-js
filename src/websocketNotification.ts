//
// Copyright 2022 Inrupt Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
// Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

// Typescript and eslint are fighting over whether these are globals
/* eslint no-shadow: 0 */
import IsoWebSocket, { MessageEvent, ErrorEvent } from "isomorphic-ws";
import { NotificationOptions, statuses } from "./interfaces";
import { LiveNotification } from "./liveNotification";

/**
 * Constructor for a WebSocket Notification instance, which allows subscribing to resources in the solid ecosystem.
 * See the [Solid Notifications Protocol Specification](https://solid.github.io/notifications/protocol) for more details.
 *
 * ```typescript
 * import { getDefaultSession } from '@inrupt/solid-authn-browser';
 * // or for node.js:
 * //   import { Session } from '@inrupt/solid-authn-node';
 *
 * const session = getDefaultSession();
 * // for node.js:
 * //   const session = new Session();
 * //   await session.login({
 * //     oidcIssuer,
 * //     clientId,
 * //     clientSecret,
 * //   });
 *
 * const socket = new WebsocketNotification(parentContainerUrl, {
 *   fetch: session.fetch,
 * });
 *
 * socket.on("message", (message) => {
 *   const notification = JSON.parse(message);
 *   console.log("Change:", notification);
 * });
 *
 * // Connect for receiving notifications:
 * await socket.connect();
 *
 * // later:
 * socket.disconnect();
 * ```
 */
export class WebsocketNotification extends LiveNotification {
  /** @internal */
  websocket?: IsoWebSocket;

  /** @hidden */
  status: statuses = "closed";

  constructor(topic: string, options?: NotificationOptions) {
    // Hardcode the protocol to WS to ask the server specifically for a websocket connection
    super(topic, ["ws"], options);
  }

  /**
   * Connects the websocket to start receiving notifications. If no
   * `providedEndpoint` or `providedSubprotocol` parameter is present, then
   * those will automatically be discovered based on the capabilities of the
   * host of the resource that you're subscribing to notifications for.
   */
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

    this.websocket = new IsoWebSocket(endpoint, subprotocol);

    this.websocket.onopen = () => {
      this.status = "connected";
      this.emitter.emit("connected");
    };

    this.websocket.onmessage = (e: MessageEvent) => {
      this.emitter.emit("message", e.data);
    };

    // TODO auto-reconnect once we get a TTL from notification connection info
    this.websocket.onclose = () => {
      this.status = "closed";
      this.emitter.emit("closed");
    };

    this.websocket.onerror = (e: ErrorEvent) => {
      this.emitter.emit("error", e);
    };
  };

  disconnect = (): void => {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
  };
}
