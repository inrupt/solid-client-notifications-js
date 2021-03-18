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

import WS from "jest-websocket-mock";
import WebsocketNotification from "./websocketNotification";

describe("WebsocketNotification", () => {
  let wssEndpoint: string;
  let wsServerMock: WS;

  beforeEach(() => {
    wssEndpoint = "wss://fake.url/some-resource";
    wsServerMock = new WS(wssEndpoint);
  });

  afterEach(() => {
    wsServerMock.close();
    WS.clean();
  });

  describe("constructor", () => {
    it("constructor hardcodes the protocol to ws", () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();

      const ws = new WebsocketNotification(topic, fetchFn);

      expect(ws.protocols).toEqual(["ws"]);
    });
  });

  describe("connect", () => {
    it("sets the status to connecting", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();

      const ws = new WebsocketNotification(topic, fetchFn);

      await ws.connect(wssEndpoint);

      expect(ws.status).toEqual("connecting");
    });

    it("does not fetch notification connection info if given", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();

      const ws = new WebsocketNotification(topic, fetchFn);
      ws.fetchNotificationConnectionInfo = jest.fn();

      await ws.connect(wssEndpoint);

      expect(ws.webSocket?.url).toEqual(wssEndpoint);
      expect(ws.fetchNotificationConnectionInfo).not.toHaveBeenCalled();
    });

    it("fetches notification connection info if not given", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      ws.fetchNotificationConnectionInfo = jest.fn().mockResolvedValue({
        endpoint: wssEndpoint,
      });

      await ws.connect();

      expect(ws.webSocket?.url).toEqual(wssEndpoint);
      expect(ws.fetchNotificationConnectionInfo).toHaveBeenCalled();
    });

    it("sets the status to connected when the websocket is opened", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      await ws.connect(wssEndpoint);
      await wsServerMock.connected;

      expect(ws.status).toEqual("connected");
    });

    it("emits a message when the websocket receives a message", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      const messageSpy = jest.fn();
      const message = "hello";

      ws.on("message", messageSpy);

      await ws.connect(wssEndpoint);
      await wsServerMock.connected;

      wsServerMock.send(message);

      expect(messageSpy).toHaveBeenCalledWith(message);
    });

    it("emits an error when the websocket emits an error", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      const errorSpy = jest.fn();

      ws.on("error", errorSpy);

      await ws.connect(wssEndpoint);
      await wsServerMock.connected;

      wsServerMock.error();

      expect(errorSpy).toHaveBeenCalled();
    });

    it("sets the status to closed when the websocket is closed", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      await ws.connect(wssEndpoint);
      await wsServerMock.connected;

      expect(ws.status).toEqual("connected");

      wsServerMock.close();
      WS.clean();

      expect(ws.status).toEqual("closed");
    });

    it("emits a closed event when the websocket is closed", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      const closedSpy = jest.fn();
      ws.on("closed", closedSpy);

      await ws.connect(wssEndpoint);
      await wsServerMock.connected;

      wsServerMock.close();
      WS.clean();

      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("closes the websocket", async () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      const closedSpy = jest.fn();
      ws.on("closed", closedSpy);

      await ws.connect(wssEndpoint);
      await wsServerMock.connected;

      ws.disconnect();

      await wsServerMock.closed;

      expect(ws.webSocket).toBeUndefined();
    });

    it("does nothing if the websocket was never initialized", () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const ws = new WebsocketNotification(topic, fetchFn);

      ws.disconnect();

      expect(ws.webSocket).toBeUndefined();
    });
  });
});
