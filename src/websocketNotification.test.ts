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
import { MessageEvent, OpenEvent, CloseEvent, ErrorEvent } from "isomorphic-ws";

import { WebsocketNotification } from "./websocketNotification";

jest.mock("isomorphic-ws");

describe("WebsocketNotification", () => {
  const wssEndpoint = "wss://fake.url/some-resource";

  describe("constructor", () => {
    it("constructor hardcodes the protocol to ws", () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();

      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      expect(ws.protocols).toEqual(["ws"]);
    });
  });

  describe("connect", () => {
    it("sets the status to connecting", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();

      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      await ws.connect(wssEndpoint);

      expect(ws.status).toEqual("connecting");
    });

    it("does not fetch notification connection info if given", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();

      const ws = new WebsocketNotification(topic, { fetch: fetchFn });
      ws.fetchNotificationConnectionInfo = jest.fn();

      await ws.connect(wssEndpoint);

      expect(ws.fetchNotificationConnectionInfo).not.toHaveBeenCalled();
    });

    it("fetches notification connection info if not given", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      ws.fetchNotificationConnectionInfo = jest.fn().mockResolvedValue({
        endpoint: wssEndpoint,
      });

      await ws.connect();

      expect(ws.fetchNotificationConnectionInfo).toHaveBeenCalled();
    });

    it("sets the status to connected when the websocket is opened", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      await ws.connect(wssEndpoint);
      ws.websocket?.onopen({} as OpenEvent);

      expect(ws.status).toEqual("connected");
    });

    it("emits a message when the websocket receives a message", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      const messageSpy = jest.fn();
      const message = "hello";

      ws.on("message", messageSpy);

      await ws.connect(wssEndpoint);
      ws.websocket?.onopen({} as OpenEvent);
      ws.websocket?.onmessage({ data: message } as MessageEvent);

      expect(messageSpy).toHaveBeenCalledWith(message);
    });

    it("emits an error when the websocket emits an error", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      const errorSpy = jest.fn();

      ws.on("error", errorSpy);

      await ws.connect(wssEndpoint);

      ws.websocket?.onerror({} as ErrorEvent);

      expect(errorSpy).toHaveBeenCalled();
    });

    it("sets the status to closed when the websocket is closed", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      await ws.connect(wssEndpoint);
      ws.websocket?.onopen({} as OpenEvent);

      expect(ws.status).toEqual("connected");

      ws.websocket?.onclose({} as CloseEvent);

      expect(ws.status).toEqual("closed");
    });

    it("emits a closed event when the websocket is closed", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      const closedSpy = jest.fn();
      ws.on("closed", closedSpy);

      await ws.connect(wssEndpoint);
      ws.websocket?.onclose({} as CloseEvent);

      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("closes the websocket", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      const closedSpy = jest.fn();
      ws.on("closed", closedSpy);

      await ws.connect(wssEndpoint);
      ws.disconnect();
      ws.websocket?.onclose({} as CloseEvent);

      expect(ws.websocket).toBeUndefined();
    });

    it("does nothing if the websocket was never initialized", () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, { fetch: fetchFn });

      ws.disconnect();

      expect(ws.websocket).toBeUndefined();
    });
  });
});
