// Copyright 2020 Inrupt Inc.
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

import { it, test, describe, expect, jest, afterEach } from "@jest/globals";

import type * as SolidClient from "@inrupt/solid-client";
import {
  BadRequestError,
  UnauthorizedError,
} from "@inrupt/solid-client-errors";
import { BaseNotification } from "./notification";

jest.mock("@inrupt/solid-client", () => ({
  ...(jest.requireActual("@inrupt/solid-client") as typeof SolidClient),
  getWellKnownSolid: jest.fn(),
}));

const mockedFetch = () => {
  return jest.fn<typeof fetch>();
};

const mockedFetchWithJsonResponse = (json: object) => {
  return mockedFetch().mockResolvedValue(
    new Response(JSON.stringify(json), { status: 200, statusText: "OK" }),
  );
};

const mockedFetchWithError = (
  status: number,
  statusText: string,
  body = "",
  headers = {},
) => {
  return mockedFetch().mockResolvedValue(
    new Response(body, { status, statusText, headers }),
  );
};

const mockedGetWellKnownSolid = () => {
  const { getWellKnownSolid } = jest.requireMock(
    "@inrupt/solid-client",
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
      const protocol = ["ws"];

      const notification = new BaseNotification(topic, protocol);

      expect(notification.topic).toEqual(topic);
      expect(notification.protocols).toEqual(protocol);
    });

    it("sets optional properties fetch, features, gateway, and host", () => {
      const fetchFn = mockedFetch();

      const topic = "https://fake.url/some-resource";
      const options = {
        features: { ttl: 500 },
        gateway: "https://fake.url/notification-gateway",
        host: "https://fake.url",
        fetch: fetchFn,
      };

      const notification = new BaseNotification(topic, ["ws"], options);

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
      const options = {
        gateway,
        fetch: fetchFn,
      };

      const notification = new BaseNotification(topic, ["ws"], options);

      const notificationGateway =
        await notification.fetchNegotiationGatewayUrl();

      expect(notificationGateway).toEqual(gateway);
      expect(getWellKnownSolidMock).not.toHaveBeenCalled();
    });

    test("throws an error if the call to getWellKnownSolid fails", async () => {
      const fetchFn = mockedFetch();
      const getWellKnownSolidMock = mockedGetWellKnownSolid().mockRejectedValue(
        new Error("Some Error"),
      );

      const topic = "https://fake.url/some-resource";

      const notification = new BaseNotification(topic, ["ws"], {
        fetch: fetchFn,
      });

      await expect(notification.fetchNegotiationGatewayUrl()).rejects.toThrow(
        NOT_SUPPORTED_ERROR_MATCHER,
      );

      expect(getWellKnownSolidMock).toHaveBeenCalledTimes(1);
    });

    test("is compatible with the well-known file on ESS 2.0", async () => {
      const fetchFn = mockedFetch();
      const getWellKnownSolidMock = mockedGetWellKnownSolid();

      const gateway = "https://gateway.test/notifications/";
      const storageServer = "https://storage.test";
      const topic = "https://storage.test/some-resource";

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

      const notification = new BaseNotification(topic, ["ws"], {
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

      const notification = new BaseNotification(topic, ["ws"], {
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

      const notification = new BaseNotification(topic, ["ws"], {
        fetch: fetchFn,
      });

      await expect(notification.fetchNegotiationGatewayUrl()).rejects.toThrow(
        NOT_SUPPORTED_ERROR_MATCHER,
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

      const notification = new BaseNotification(topic, ["ws"], {
        gateway,
        fetch: fetchFn,
      });

      notification.fetchNegotiationGatewayUrl =
        jest.fn<typeof notification.fetchNegotiationGatewayUrl>();

      await notification.fetchProtocolNegotiationInfo();

      expect(notification.fetchNegotiationGatewayUrl).not.toHaveBeenCalled();
    });

    test.each([
      [mockedFetchWithJsonResponse],
      [
        // Modify global fetch to test providing no fetch.
        (response: unknown) => {
          jest
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(
              new Response(JSON.stringify(response), { status: 200 }),
            );
        },
      ],
    ])("fetches the gateway if it is not defined", async (mockerFn) => {
      const fetchFn = mockerFn({
        endpoint: "https://fake.url/some-endpoint",
        protocol: "ws",
        subprotocol: "solid-0.2",
      });

      const topic = "https://fake.url/some-resource";

      const notification = new BaseNotification(topic, ["ws"], {
        fetch: fetchFn ?? undefined,
      });

      const gateway = "https://fake.url/notifications/";

      // Mock gateway fetch
      notification.fetchNegotiationGatewayUrl = jest
        .fn(notification.fetchNegotiationGatewayUrl)
        .mockResolvedValue(gateway);

      await notification.fetchProtocolNegotiationInfo();

      expect(notification.fetchNegotiationGatewayUrl).toHaveBeenCalledTimes(1);

      expect(fetchFn ?? fetch).toHaveBeenCalledTimes(1);
      expect(fetchFn ?? fetch).toHaveBeenCalledWith(gateway, expect.anything());

      expect(notification.gateway).toEqual(gateway);
    });

    test("fetches protocol negotiation info", async () => {
      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";
      const protocol = ["ws"];

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

      expect(info).toEqual({ endpoint });

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

    test("throws a BadRequestError if the negotiation info fetch fails, using problem details", async () => {
      const fetchFn = mockedFetchWithError(
        400,
        "BadRequest",
        `{"status": 400, "title": "Negotiation error", "detail": "Example detail"}`,
        { "Content-Type": "application/problem+json" },
      );

      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";

      const notification = new BaseNotification(topic, ["ws"], {
        gateway,
        fetch: fetchFn,
      });

      const err: BadRequestError = await notification
        .fetchProtocolNegotiationInfo()
        .catch((e) => e);

      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.problemDetails.status).toBe(400);
      expect(err.problemDetails.title).toBe("Negotiation error");
      expect(err.problemDetails.detail).toBe("Example detail");
    });

    test("throws an UnauthorizedError if the negotiation info fetch fails, not using problem details", async () => {
      const fetchFn = mockedFetchWithError(401, "Unauthorized");

      const gateway = "https://fake.url/notifications/";
      const topic = "https://fake.url/some-resource";

      const notification = new BaseNotification(topic, ["ws"], {
        gateway,
        fetch: fetchFn,
      });

      const err: UnauthorizedError = await notification
        .fetchProtocolNegotiationInfo()
        .catch((e) => e);

      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.problemDetails.status).toBe(401);
      expect(err.problemDetails.title).toBe("Unauthorized");
      expect(err.problemDetails.detail).toBeUndefined();
    });
  });

  describe("fetchNotificationConnectionInfo", () => {
    test.each([
      [mockedFetchWithJsonResponse],
      [
        // Enforce the global fetch behavior when providing no fetch.
        (response: unknown) => {
          jest
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(
              new Response(JSON.stringify(response), { status: 200 }),
            );
        },
      ],
    ])("fetches protocol negotiation info", async (mockerFn) => {
      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";

      const fetchFn = mockerFn({
        endpoint,
      });

      const notification = new BaseNotification(topic, ["ws"], {
        fetch: fetchFn ?? undefined,
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

    test("throws a BadRequestError if the negotiation connection info fetch fails, using problem details", async () => {
      const fetchFn = mockedFetchWithError(
        400,
        "Bad Request",
        `{"status": 400, "title": "Connection info error", "detail": "Connection info error detail"}`,
        { "Content-Type": "application/problem+json" },
      );

      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const notification = new BaseNotification(topic, ["ws"], {
        fetch: fetchFn,
      });

      notification.fetchProtocolNegotiationInfo = jest
        .fn(notification.fetchProtocolNegotiationInfo)
        .mockResolvedValue({
          endpoint,
          protocol: "ws",
          features: {},
        });

      const err: BadRequestError = await notification
        .fetchNotificationConnectionInfo()
        .catch((e) => e);

      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.problemDetails.status).toBe(400);
      expect(err.problemDetails.title).toBe("Connection info error");
      expect(err.problemDetails.detail).toBe("Connection info error detail");
    });

    test("throws a BadRequestError if the negotiation connection info fetch fails, without using problem details", async () => {
      const fetchFn = mockedFetchWithError(400, "Bad Request");

      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const notification = new BaseNotification(topic, ["ws"], {
        fetch: fetchFn,
      });

      notification.fetchProtocolNegotiationInfo = jest
        .fn(notification.fetchProtocolNegotiationInfo)
        .mockResolvedValue({
          endpoint,
          protocol: "ws",
          features: {},
        });

      const err: BadRequestError = await notification
        .fetchNotificationConnectionInfo()
        .catch((e) => e);

      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.problemDetails.status).toBe(400);
      expect(err.problemDetails.title).toBe("Bad Request");
      expect(err.problemDetails.detail).toBeUndefined();
    });

    test("fetches negotiation connection info", async () => {
      const endpoint = "https://fake.url/some-endpoint";
      const topic = "https://fake.url/some-resource";
      const jsonResponse = {
        endpoint: "wss://fake.url/some-resource?extraInfo=some-code",
        features: ["ttl"],
        arbitraryData: true,
        moreJsonValues: 10,
      };

      const fetchFn = mockedFetchWithJsonResponse(jsonResponse);

      const notification = new BaseNotification(topic, ["ws"], {
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
});
