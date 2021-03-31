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

// Allow shadowing fetch
/* eslint no-shadow: 0 */

import fetch from "jest-fetch-mock";
import BaseNotification, { protocols } from "./notification";

describe("BaseNotification", () => {
  describe("constructor", () => {
    it("sets required properties topic, fetch, and protocols", () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, fetchFn, protocol);

      expect(notification.topic).toEqual(topic);
      expect(notification.fetch).toEqual(fetchFn);
      expect(notification.protocols).toEqual(protocol);
    });

    it("sets optional properties features, gateway, and host", () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const protocol = ["ws"] as Array<protocols>;
      const options = {
        features: { ttl: 500 },
        gateway: "https://fake.url/notification-gateway",
        host: "https://fake.url",
      };

      const notification = new BaseNotification(
        topic,
        fetchFn,
        protocol,
        options
      );

      expect(notification.features).toEqual(options.features);
      expect(notification.gateway).toEqual(options.gateway);
      expect(notification.host).toEqual(options.host);
    });

    it("sets the host from the domain of the topic if no host was given", () => {
      const topic = "https://fake.url/some-resource";
      const fetchFn = jest.fn();
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, fetchFn, protocol);

      expect(notification.host).toEqual("https://fake.url");
    });
  });

  describe("static methods", () => {
    test("getRootDomain returns the protocol and hostname for a url", () => {
      const domain = "https://fake.url";
      const fullUrl = `${domain}/some-resource/something.txt`;
      expect(BaseNotification.getRootDomain(fullUrl)).toEqual(domain);
    });

    test("getSolidWellKnownUrl returns the solid well-known url for a given domain", () => {
      const domain = "https://fake.url";

      expect(BaseNotification.getSolidWellKnownUrl(domain)).toEqual(
        `${domain}/.well-known/solid`
      );
    });
  });

  describe("fetchNegotiationGatewayUrl", () => {
    test("does not fetch if the gateway is already defined", async () => {
      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const fetchFn = jest.fn();

      const notification = new BaseNotification(topic, fetchFn, protocol, {
        gateway,
      });

      const notificationGateway = await notification.fetchNegotiationGatewayUrl();

      expect(notificationGateway).toEqual(gateway);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    test("requests the well-known file to load the notificationGateway url", async () => {
      const gateway = "https://fake.url/notifications/";
      fetch.mockResponseOnce(JSON.stringify({ notificationGateway: gateway }));

      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, fetch, protocol);
      const notificationGateway = await notification.fetchNegotiationGatewayUrl();

      expect(notificationGateway).toEqual(gateway);
    });

    test("throws a FetchError if the well-known fetch fails", async () => {
      fetch.mockResponseOnce("", {
        status: 400,
        statusText: "Invalid request",
      });

      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, fetch, protocol);

      await expect(notification.fetchNegotiationGatewayUrl()).rejects.toThrow();
    });
  });

  describe("fetchProtocolNegotiationInfo", () => {
    test("does not fetch the gateway if it is already defined", async () => {
      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, fetch, protocol, {
        gateway,
      });

      notification.fetchNegotiationGatewayUrl = jest.fn();

      fetch.mockResponseOnce("{}");

      await notification.fetchProtocolNegotiationInfo();

      expect(notification.fetchNegotiationGatewayUrl).not.toHaveBeenCalled();
    });

    test("fetches the gateway if it is not defined", async () => {
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, fetch, protocol);

      const gateway = "https://fake.url/notifications/";

      // Mock gateway fetch
      fetch.mockResponseOnce(JSON.stringify({ notificationGateway: gateway }));

      // Mock fetchProtocolNegotiationInfo fetch
      fetch.mockResponseOnce("{}");

      await notification.fetchProtocolNegotiationInfo();

      expect(fetch).toHaveBeenCalled();
      expect(notification.gateway).toEqual(gateway);
    });

    test("fetches protocol negotiation info", async () => {
      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const response = { endpoint: "https://fake.url/some-endpoint" };
      fetch.mockResponseOnce(JSON.stringify(response));

      const notification = new BaseNotification(topic, fetch, protocol, {
        gateway,
        features: { ttl: 10 },
      });

      const info = await notification.fetchProtocolNegotiationInfo();

      expect(info).toStrictEqual(response);

      expect(fetch).toHaveBeenCalledWith(gateway, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          protocols: protocol,
          features: ["ttl"],
        }),
      });
    });

    test("throws a FetchError if the negotiation info fetch fails", async () => {
      fetch.mockResponseOnce("", {
        status: 400,
        statusText: "Invalid request",
      });

      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, fetch, protocol, {
        gateway,
      });

      await expect(
        notification.fetchProtocolNegotiationInfo()
      ).rejects.toThrow();
    });
  });

  describe("fetchNotificationConnectionInfo", () => {
    test("fetches protocol negotation info", async () => {
      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const notification = new BaseNotification(topic, fetch, protocol);

      notification.fetchProtocolNegotiationInfo = jest
        .fn()
        .mockResolvedValue({ endpoint });

      fetch.mockResponseOnce("{}");

      await notification.fetchNotificationConnectionInfo();

      expect(notification.fetchProtocolNegotiationInfo).toHaveBeenCalled();
    });

    test("throws a FetchError if the negotiation connection info fetch fails", async () => {
      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const notification = new BaseNotification(topic, fetch, protocol);

      notification.fetchProtocolNegotiationInfo = jest
        .fn()
        .mockResolvedValue({ endpoint });

      fetch.mockResponseOnce("", {
        status: 400,
        statusText: "Invalid request",
      });

      await expect(
        notification.fetchNotificationConnectionInfo()
      ).rejects.toThrow();
    });

    test("fetches negotiation connection info", async () => {
      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const notification = new BaseNotification(topic, fetch, protocol);

      const jsonResponse = {
        endpoint: "wss://fake.url/some-resource?extraInfo=some-code",
        features: ["ttl"],
        arbitraryData: true,
        moreJsonValues: 10,
      };

      notification.fetchProtocolNegotiationInfo = jest
        .fn()
        .mockResolvedValue({ endpoint });

      fetch.mockResponseOnce(JSON.stringify(jsonResponse));

      const response = await notification.fetchNotificationConnectionInfo();

      expect(response).toEqual(jsonResponse);
    });
  });
});
