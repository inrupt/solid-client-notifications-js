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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { it, describe, expect, jest } from "@jest/globals";

import { MessageEvent, CloseEvent, ErrorEvent } from "isomorphic-ws";
import { NotificationConnectionInfo } from "./interfaces";

import { WebsocketNotification } from "./websocketNotification";

jest.mock("isomorphic-ws");

describe("WebsocketNotification", () => {
  const wssEndpoint = "wss://fake.url/some-resource";

  describe("constructor", () => {
    it("constructor hardcodes the protocol to ws", () => {
      const topic = "https://fake.url/some-resource";

      const ws = new WebsocketNotification(topic);

      expect(ws.protocols).toEqual(["ws"]);
    });
  });

  describe("connect", () => {
    it("sets the status to connecting", async () => {
      const topic = "https://fake.url/some-resource";

      const ws = new WebsocketNotification(topic);

      await ws.connect(wssEndpoint);

      expect(ws.status).toBe("connecting");
    });

    it("does not fetch notification connection info if given", async () => {
      const topic = "https://fake.url/some-resource";

      const ws = new WebsocketNotification(topic);
      ws.fetchNotificationConnectionInfo = jest.fn();

      await ws.connect(wssEndpoint);

      expect(ws.fetchNotificationConnectionInfo).not.toHaveBeenCalled();
    });

    it("fetches notification connection info if not given", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      ws.fetchNotificationConnectionInfo = jest
        .fn<Promise<NotificationConnectionInfo>, never>()
        .mockResolvedValue({
          endpoint: wssEndpoint,
          protocol: "ws",
          subprotocol: "solid-0.2",
        });

      await ws.connect();

      expect(ws.fetchNotificationConnectionInfo).toHaveBeenCalled();
    });

    it("sets the status to connected when the websocket is opened", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      await ws.connect(wssEndpoint);

      ws.websocket!.onopen!({ type: "open", target: ws.websocket! });

      expect(ws.status).toBe("connected");
    });

    it("emits an error when the websocket emits an error", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      const errorSpy = jest.fn();

      ws.on("error", errorSpy);

      await ws.connect(wssEndpoint);

      ws.websocket!.onerror!({} as ErrorEvent);

      expect(errorSpy).toHaveBeenCalled();
    });

    it("sets the status to closed when the websocket is closed", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      await ws.connect(wssEndpoint);
      ws.websocket!.onopen!({ type: "open", target: ws.websocket! });

      expect(ws.status).toBe("connected");

      ws.websocket!.onclose!({} as CloseEvent);

      expect(ws.status).toBe("closed");
    });

    it("emits a closed event when the websocket is closed", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      const closedSpy = jest.fn();
      ws.on("closed", closedSpy);

      await ws.connect(wssEndpoint);
      ws.websocket!.onclose!({} as CloseEvent);

      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe("on message", () => {
    it("emits a message when the websocket receives a valid message", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      const messageSpy = jest.fn();
      const message = `{"id":"urn:uuid:92a3d416-1d23-4c74-9ef5-41d62f329a07","type":["http://www.w3.org/ns/prov#Activity","Update"],"actor":[""],"object":{"id":"https://storage.inrupt.com/e9179f88-ca8f-45e1-a1b9-88a83f61db5e/","state":"8654e150-75c0-4fab-85f4-2f015b60da2d","type":["http://www.w3.org/ns/ldp#Container","http://www.w3.org/ns/ldp#Resource","http://www.w3.org/ns/ldp#RDFSource","http://www.w3.org/ns/ldp#BasicContainer"]},"published":"2022-04-20T00:17:21.714135Z","@context":["https://www.w3.org/ns/activitystreams",{"state":{"@id":"http://www.w3.org/2011/http-headers#etag"}}]}`;
      const parsedMessage = {
        id: "urn:uuid:92a3d416-1d23-4c74-9ef5-41d62f329a07",
        type: ["http://www.w3.org/ns/prov#Activity", "Update"],
        actor: [""],
        object: {
          id: "https://storage.inrupt.com/e9179f88-ca8f-45e1-a1b9-88a83f61db5e/",
          state: "8654e150-75c0-4fab-85f4-2f015b60da2d",
          type: [
            "http://www.w3.org/ns/ldp#Container",
            "http://www.w3.org/ns/ldp#Resource",
            "http://www.w3.org/ns/ldp#RDFSource",
            "http://www.w3.org/ns/ldp#BasicContainer",
          ],
        },
        published: "2022-04-20T00:17:21.714135Z",
        "@context": [
          "https://www.w3.org/ns/activitystreams",
          { state: { "@id": "http://www.w3.org/2011/http-headers#etag" } },
        ],
      };

      ws.on("message", messageSpy);

      await ws.connect(wssEndpoint);
      ws.websocket!.onopen!({ type: "open", target: ws.websocket! });
      ws.websocket!.onmessage!({ data: message } as MessageEvent);

      expect(messageSpy).toHaveBeenCalledWith(parsedMessage);
    });

    it("does not emit a message if the message is invalid JSON", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      const messageSpy = jest.fn();
      const message = `invalid JSON`;

      // eslint-disable-next-line no-console
      console.info("Note: we expect a console.warn to come next");
      ws.on("message", messageSpy);

      await ws.connect(wssEndpoint);
      ws.websocket!.onopen!({ type: "open", target: ws.websocket! });
      ws.websocket!.onmessage!({ data: message } as MessageEvent);

      expect(messageSpy).not.toHaveBeenCalled();
    });

    it("does not emit a message if the message is not a string", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      const messageSpy = jest.fn();

      // Sets message to be an ArrayBuffer theoretically the websocket should
      // also have bufferType === "arraybuffer", for an ArrayBuffer instead of
      // Blob to be emitted, but the ws module only implements ArrayBuffers.
      // More info:
      // https://websockets.spec.whatwg.org/#dom-binarytype-arraybuffer
      const message = new TextEncoder().encode("test");

      // eslint-disable-next-line no-console
      console.info("Note: we expect a console.warn to come next");
      ws.on("message", messageSpy);

      await ws.connect(wssEndpoint);
      ws.websocket!.onopen!({ type: "open", target: ws.websocket! });
      ws.websocket!.onmessage!({ data: message } as MessageEvent);

      expect(messageSpy).not.toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("closes the websocket", async () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      const closedSpy = jest.fn();
      ws.on("closed", closedSpy);

      await ws.connect(wssEndpoint);
      ws.websocket!.onclose!({} as CloseEvent);
      ws.disconnect();

      expect(ws.websocket).toBeUndefined();
    });

    it("does nothing if the websocket was never initialized", () => {
      const topic = "https://fake.url/some-resource";
      const ws = new WebsocketNotification(topic);

      ws.disconnect();

      expect(ws.websocket).toBeUndefined();
    });
  });
});
