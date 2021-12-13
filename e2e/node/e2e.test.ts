/**
 * Copyright 2020 Inrupt Inc.
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

import { jest, describe, it, expect, afterEach } from "@jest/globals";
import { Session } from "@inrupt/solid-client-authn-node";
import { config } from "dotenv-flow";
import * as openidClient from "openid-client";

import { WebsocketNotification } from "../../src/index";

config({
  path: __dirname,
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

type NotificationGateway = string;
type OidcIssuer = string;
type ClientId = string;
type ClientSecret = string;
type Pod = string;

type AuthDetails = [
  NotificationGateway,
  Pod,
  OidcIssuer,
  ClientId,
  ClientSecret
];

// Instructions for obtaining these credentials can be found here:
// https://github.com/inrupt/solid-client-authn-js/blob/1a97ef79057941d8ac4dc328fff18333eaaeb5d1/packages/node/example/bootstrappedApp/README.md
const serversUnderTest: AuthDetails[] = [
  // pod.inrupt.com:
  [
    process.env.E2E_TEST_ESS_NOTIFICATION_GATEWAY!,
    process.env.E2E_TEST_ESS_POD!.replace(/^https:\/\//, ""),
    process.env.E2E_TEST_ESS_IDP_URL!.replace(/^https:\/\//, ""),
    process.env.E2E_TEST_ESS_CLIENT_ID!,
    process.env.E2E_TEST_ESS_CLIENT_SECRET!,
  ],
  /*
  FIXME: temporarily disable dev-next tests. dev-next uses the new Notification
  protocol: https://solid.github.io/notifications/protocol, while this codebase
  uses a previous version.
  [
    process.env.E2E_TEST_DEV_NEXT_NOTIFICATION_GATEWAY!,
    // Cumbersome workaround, but:
    // Trim `https://` from the start of these URLs,
    // so that GitHub Actions doesn't replace them with *** in the logs.
    process.env.E2E_TEST_DEV_NEXT_POD!.replace(/^https:\/\//, ""),
    process.env.E2E_TEST_DEV_NEXT_IDP_URL!.replace(/^https:\/\//, ""),
    process.env.E2E_TEST_DEV_NEXT_CLIENT_ID!,
    process.env.E2E_TEST_DEV_NEXT_CLIENT_SECRET!,
  ],
  */
  // pod-compat.inrupt.com, temporarily disabled while WSS is in dev:
  /*
  [
    process.env.E2E_TEST_ESS_NOTIFICATION_GATEWAY!,
    process.env.E2E_TEST_ESS_COMPAT_POD!,
    process.env.E2E_TEST_ESS_COMPAT_IDP_URL!,
    process.env.E2E_TEST_ESS_COMPAT_CLIENT_ID!,
    process.env.E2E_TEST_ESS_COMPAT_CLIENT_SECRET!,
  ],
  */
];

describe.each(serversUnderTest)(
  "Authenticated end-to-end tests for gateway [%s] against Pod [%s] and OIDC Issuer [%s]:",
  (
    notificationGateway,
    rootContainerDisplay,
    oidcIssuerDisplay,
    clientId,
    clientSecret
  ) => {
    const rootContainer = "https://" + rootContainerDisplay;
    const oidcIssuer = "https://" + oidcIssuerDisplay;

    let ws: WebsocketNotification | undefined;

    afterEach(() => {
      if (ws) {
        ws.disconnect();
      }
    });

    async function getSession() {
      const session = new Session();
      await session.login({
        oidcIssuer: oidcIssuer,
        clientId: clientId,
        clientName: "Solid Client End-2-End Test Client App - Node.js",
        clientSecret: clientSecret,
      });
      return session;
    }

    it("can connect to a websocket on the root container", async () => {
      // Lots of requests being made; we'll give it some extra time.
      jest.setTimeout(15000);
      openidClient.custom.setHttpOptionsDefaults({ timeout: 5000 });

      const session = await getSession();

      ws = new WebsocketNotification(rootContainer, {
        gateway: notificationGateway,
        fetch: session.fetch,
      });

      expect(ws.status).toBe("closed");

      ws.connect();

      await new Promise((resolve, reject) => {
        ws?.on("connected", () => {
          resolve(undefined);
        });
        ws?.on("error", (e: Error) => {
          reject(e);
        });
      });

      expect(ws.status).toBe("connected");

      ws.disconnect();

      await new Promise((resolve, reject) => {
        ws?.on("closed", () => {
          resolve(undefined);
        });
        ws?.on("error", (e: Error) => {
          reject(e);
        });
      });

      expect(ws.status).toBe("closed");
    });
  }
);
