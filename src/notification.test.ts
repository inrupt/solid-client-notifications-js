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

import {
  it,
  test,
  describe,
  expect,
  jest,
  afterEach,
  beforeEach,
} from "@jest/globals";

import crossFetch, { Response } from "cross-fetch";
import type * as SolidClient from "@inrupt/solid-client";
import type * as SolidClientAuthnBrowser from "@inrupt/solid-client-authn-browser";

import { protocols } from "./interfaces";
import { BaseNotification } from "./notification";

jest.mock("@inrupt/solid-client", () => ({
  ...(jest.requireActual("@inrupt/solid-client") as typeof SolidClient),
  getWellKnownSolid: jest.fn(),
}));

jest.mock("@inrupt/solid-client-authn-browser", () => ({
  ...(jest.requireActual(
    "@inrupt/solid-client-authn-browser"
  ) as typeof SolidClientAuthnBrowser),
  fetch: jest.fn(),
}));

const mockedFetch = (fetch: typeof crossFetch = crossFetch) => {
  return jest.fn(fetch);
};

const mockedFetchWithJsonResponse = (
  json: object,
  fetch: typeof crossFetch = crossFetch
) => {
  return mockedFetch(fetch).mockResolvedValue(
    new Response(JSON.stringify(json), { status: 200 })
  );
};

const mockedFetchWithError = (
  status: number,
  body = "",
  fetch: typeof crossFetch = crossFetch
) => {
  return mockedFetch(fetch).mockResolvedValue(new Response(body, { status }));
};

const mockedGetWellKnownSolid = () => {
  const { getWellKnownSolid } = jest.requireMock(
    "@inrupt/solid-client"
  ) as jest.Mocked<typeof SolidClient>;

  return getWellKnownSolid;
};

const NOT_SUPPORTED_ERROR_MATCHER = /not support notifications/;

describe("BaseNotification", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("sets required properties topic, fetch, and protocols", () => {
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, protocol);

      expect(notification.topic).toEqual(topic);
      expect(notification.protocols).toEqual(protocol);
    });

    it("sets optional properties fetch, features, gateway, and host", () => {
      const fetchFn = mockedFetch();

      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const options = {
        features: { ttl: 500 },
        gateway: "https://fake.url/notification-gateway",
        host: "https://fake.url",
        fetch: fetchFn,
      };

      const notification = new BaseNotification(topic, protocol, options);

      expect(notification.features).toEqual(options.features);
      expect(notification.gateway).toEqual(options.gateway);
      expect(notification.fetch).toEqual(fetchFn);
    });
  });

  describe("fetchNegotiationGatewayUrl", () => {
    test("does not fetch if the gateway is already defined", async () => {
      const fetchFn = mockedFetch();
      const getWellKnownSolidMock = mockedGetWellKnownSolid();

      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const options = {
        gateway,
        fetch: fetchFn,
      };

      const notification = new BaseNotification(topic, protocol, options);

      const notificationGateway =
        await notification.fetchNegotiationGatewayUrl();

      expect(notificationGateway).toEqual(gateway);
      expect(getWellKnownSolidMock).not.toHaveBeenCalled();
    });

    test("throws an error if the call to getWellKnownSolid fails", async () => {
      const fetchFn = mockedFetch();
      const getWellKnownSolidMock = mockedGetWellKnownSolid().mockRejectedValue(
        new Error("Some Error")
      );

      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      await expect(notification.fetchNegotiationGatewayUrl()).rejects.toThrow(
        NOT_SUPPORTED_ERROR_MATCHER
      );

      expect(getWellKnownSolidMock).toHaveBeenCalledTimes(1);
    });

    test("is compatible with the well-known file on ESS 2.0", async () => {
      const fetchFn = mockedFetch();
      const getWellKnownSolidMock = mockedGetWellKnownSolid();

      const gateway = "https://gateway.test/notifications/";
      const storageServer = "https://storage.test";
      const topic = "https://storage.test/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      getWellKnownSolidMock.mockResolvedValue({
        graphs: {
          default: {
            "_:b0": {
              type: "Subject",
              url: "_:b0",
              predicates: {
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": {
                  namedNodes: [
                    "http://www.w3.org/ns/solid/terms#DiscoveryDocument",
                  ],
                },
                "http://www.w3.org/ns/solid/terms#notificationGateway": {
                  namedNodes: [gateway],
                },
              },
            },
          },
        },
        type: "Dataset",
        internal_resourceInfo: {
          sourceIri: `${storageServer}/.well-known/solid`,
          isRawData: false,
          contentType: "application/ld+json",
          linkedResources: {},
        },
      });

      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      const notificationGateway =
        await notification.fetchNegotiationGatewayUrl();

      expect(fetchFn).not.toHaveBeenCalled();
      expect(getWellKnownSolidMock).toHaveBeenCalledTimes(1);
      // Ensure we actually pass the fetchFn from `BaseNotification#fetch`
      expect(getWellKnownSolidMock).toHaveBeenCalledWith(topic, {
        fetch: fetchFn,
      });
      expect(notificationGateway).toEqual(gateway);
    });

    test("is compatible with the well-known file on ESS 1.1", async () => {
      const fetchFn = mockedFetch();
      const getWellKnownSolidMock = mockedGetWellKnownSolid();

      const gateway = "https://gateway.test/notifications/";
      const pod = "https://storage.test/some-pod/";
      const topic = new URL("some-resource", pod).toString();
      const protocol = ["ws"] as Array<protocols>;

      getWellKnownSolidMock.mockResolvedValue({
        graphs: {
          default: {
            "_:b0": {
              type: "Subject",
              url: "_:b0",
              predicates: {
                "http://inrupt.com/ns/ess#consentIssuer": {
                  namedNodes: ["https://consent.test"],
                },
                "http://inrupt.com/ns/ess#notificationGatewayEndpoint": {
                  namedNodes: [gateway],
                },
                "http://www.w3.org/ns/pim/space#storage": {
                  namedNodes: [pod],
                },
              },
            },
          },
        },
        type: "Dataset",
        internal_resourceInfo: {
          sourceIri: `${pod}/.well-known/solid`,
          isRawData: false,
          contentType: "application/ld+json",
          linkedResources: {},
        },
      });

      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      const notificationGateway =
        await notification.fetchNegotiationGatewayUrl();

      expect(fetchFn).not.toHaveBeenCalled();
      expect(getWellKnownSolidMock).toHaveBeenCalledTimes(1);
      expect(notificationGateway).toEqual(gateway);
    });

    test("throws an error if no Notification Gateway is found", async () => {
      const fetchFn = mockedFetch();
      const getWellKnownSolidMock = mockedGetWellKnownSolid();

      const pod = "https://storage.test/some-pod/";
      const topic = new URL("some-resource", pod).toString();
      const protocol = ["ws"] as Array<protocols>;

      getWellKnownSolidMock.mockResolvedValue({
        graphs: {
          default: {
            "_:b0": {
              type: "Subject",
              url: "_:b0",
              predicates: {},
            },
          },
        },
        type: "Dataset",
        internal_resourceInfo: {
          sourceIri: `${pod}/.well-known/solid`,
          isRawData: false,
          contentType: "application/ld+json",
          linkedResources: {},
        },
      });

      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      await expect(notification.fetchNegotiationGatewayUrl()).rejects.toThrow(
        NOT_SUPPORTED_ERROR_MATCHER
      );

      expect(fetchFn).not.toHaveBeenCalled();
      expect(getWellKnownSolidMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchProtocolNegotiationInfo", () => {
    test("does not fetch the gateway if it is already defined", async () => {
      const fetchFn = mockedFetchWithJsonResponse({
        endpoint: "https://fake.url/some-endpoint",
        protocol: "ws",
        subprotocol: "solid-0.2",
      });

      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, protocol, {
        gateway,
        fetch: fetchFn,
      });

      notification.fetchNegotiationGatewayUrl = jest.fn();

      await notification.fetchProtocolNegotiationInfo();

      expect(notification.fetchNegotiationGatewayUrl).not.toHaveBeenCalled();
    });

    test("fetches the gateway if it is not defined", async () => {
      const fetchFn = mockedFetchWithJsonResponse({
        endpoint: "https://fake.url/some-endpoint",
        protocol: "ws",
        subprotocol: "solid-0.2",
      });

      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      const gateway = "https://fake.url/notifications/";

      // Mock gateway fetch
      notification.fetchNegotiationGatewayUrl = jest
        .fn(notification.fetchNegotiationGatewayUrl)
        .mockResolvedValue(gateway);

      await notification.fetchProtocolNegotiationInfo();

      expect(notification.fetchNegotiationGatewayUrl).toHaveBeenCalledTimes(1);

      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledWith(gateway, expect.anything());

      expect(notification.gateway).toEqual(gateway);
    });

    test("fetches protocol negotiation info", async () => {
      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const endpoint = "https://fake.url/some-endpoint";
      const fetchFn = mockedFetchWithJsonResponse({
        endpoint,
      });

      const notification = new BaseNotification(topic, protocol, {
        gateway,
        features: { ttl: 10 },
        fetch: fetchFn,
      });

      // Mock gateway fetch
      notification.fetchNegotiationGatewayUrl = jest
        .fn(notification.fetchNegotiationGatewayUrl)
        .mockResolvedValue(gateway);

      const info = await notification.fetchProtocolNegotiationInfo();

      expect(info).toStrictEqual({ endpoint });

      expect(fetchFn).toHaveBeenCalledWith(gateway, {
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
      const fetchFn = mockedFetchWithError(400);

      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const notification = new BaseNotification(topic, protocol, {
        gateway,
        fetch: fetchFn,
      });

      await expect(
        notification.fetchProtocolNegotiationInfo()
      ).rejects.toThrow();
    });
  });

  describe("fetchNotificationConnectionInfo", () => {
    test("fetches protocol negotiation info", async () => {
      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      const fetchFn = mockedFetchWithJsonResponse({
        endpoint,
      });

      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      notification.fetchProtocolNegotiationInfo = jest
        .fn(notification.fetchProtocolNegotiationInfo)
        .mockResolvedValue({
          endpoint,
          protocol: "ws",
          features: {},
        });

      await notification.fetchNotificationConnectionInfo();

      expect(notification.fetchProtocolNegotiationInfo).toHaveBeenCalled();
    });

    test("throws a FetchError if the negotiation connection info fetch fails", async () => {
      const fetchFn = mockedFetchWithError(400);

      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      notification.fetchProtocolNegotiationInfo = jest
        .fn(notification.fetchProtocolNegotiationInfo)
        .mockResolvedValue({
          endpoint,
          protocol: "ws",
          features: {},
        });

      await expect(
        notification.fetchNotificationConnectionInfo()
      ).rejects.toThrow();
    });

    test("fetches negotiation connection info", async () => {
      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const jsonResponse = {
        endpoint: "wss://fake.url/some-resource?extraInfo=some-code",
        features: ["ttl"],
        arbitraryData: true,
        moreJsonValues: 10,
      };

      const fetchFn = mockedFetchWithJsonResponse(jsonResponse);

      const notification = new BaseNotification(topic, protocol, {
        fetch: fetchFn,
      });

      notification.fetchProtocolNegotiationInfo = jest
        .fn(notification.fetchProtocolNegotiationInfo)
        .mockResolvedValue({
          endpoint,
          protocol: "ws",
          features: {},
        });

      const response = await notification.fetchNotificationConnectionInfo();

      expect(response).toEqual(jsonResponse);
    });
  });

  describe("defaultSession", () => {
    it("attempts to import the default session and uses its fetch function", async () => {
      const { fetch: authnFetch } = jest.requireMock(
        "@inrupt/solid-client-authn-browser"
      ) as jest.Mocked<typeof SolidClientAuthnBrowser>;

      expect(await BaseNotification.getDefaultSessionFetch()).toEqual(
        authnFetch
      );

      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;
      const notification = new BaseNotification(topic, protocol);

      // Loading the default session fetch is asynchronous, so we keep track of
      // that operation and block all calls until it's loaded:
      await notification.fetchLoader;

      expect(notification.fetch).toBe(authnFetch);
    });
  });

  describe("uses defaultSession if fetch is not passed in", () => {
    let originalGetDefaultSessionFetch: typeof BaseNotification.getDefaultSessionFetch;

    beforeEach(() => {
      originalGetDefaultSessionFetch = BaseNotification.getDefaultSessionFetch;
    });

    afterEach(() => {
      BaseNotification.getDefaultSessionFetch = originalGetDefaultSessionFetch;
    });

    it("calls BaseNotification.getDefaultSessionFetch", async () => {
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"] as Array<protocols>;

      BaseNotification.getDefaultSessionFetch = jest.fn(
        BaseNotification.getDefaultSessionFetch
      );

      /* eslint no-new: 0 */
      new BaseNotification(topic, protocol);

      expect(BaseNotification.getDefaultSessionFetch).toHaveBeenCalled();
    });
  });
});
