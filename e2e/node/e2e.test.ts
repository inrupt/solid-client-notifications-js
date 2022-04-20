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
  // eslint-disable-next-line no-shadow
  jest,
  // eslint-disable-next-line no-shadow
  describe,
  // eslint-disable-next-line no-shadow
  it,
  // eslint-disable-next-line no-shadow
  expect,
  // eslint-disable-next-line no-shadow
  afterEach,
  // eslint-disable-next-line no-shadow
  beforeEach,
} from "@jest/globals";
import { Session } from "@inrupt/solid-client-authn-node";
import { config } from "dotenv-flow";
import * as openidClient from "openid-client";
import {
  getPodUrlAll,
  createContainerInContainer,
  deleteContainer,
  getSourceIri,
} from "@inrupt/solid-client";
import { WebsocketNotification, ErrorEvent } from "../../src/index";

import { getTestingEnvironmentNode } from "../utils/getTestingEnvironment";

const {
  idp: oidcIssuer,
  environment,
  clientId,
  clientSecret,
  notificationGateway,
  protocol,
} = getTestingEnvironmentNode();

const TEST_SLUG = "solid-client-test-e2e-notifications";

// Allows us to skip a test pending some conditions.
const testIf = (condition: boolean) => (condition ? it : it.skip);

const nextWebsocketMessage = async (ws: WebsocketNotification) => {
  return new Promise((resolve) => {
    // TODO: implement ws.once
    ws?.emitter?.once("message", (payload: object) => {
      resolve(payload);
    });
  });
};

describe(`Authenticated end-to-end notifications tests for environment [${environment}}]`, () => {
  // Lots of requests being made; we'll give it some extra time.
  jest.setTimeout(15000);
  openidClient.custom.setHttpOptionsDefaults({ timeout: 5000 });

  let ws: WebsocketNotification | undefined;
  const session = new Session();
  let rootContainer: string;
  let userAgentFetch: typeof fetch;

  beforeEach(async () => {
    // Log both sessions in.
    await session.login({
      oidcIssuer,
      clientId,
      clientSecret,
    });

    if (!session.info.isLoggedIn) {
      throw new Error("Logging the test agent in failed.");
    }

    userAgentFetch = (url: RequestInfo, options?: RequestInit) => {
      return session.fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          "User-Agent": TEST_SLUG,
        },
      });
    };

    // Figure out the test user's Pod root
    const podRootAll = await getPodUrlAll(session.info.webId as string);
    if (podRootAll.length === 0) {
      throw new Error(
        `No Pod root were found in the profile associated to [${session.info.webId}]`
      );
    }
    // Arbitrarily pick one available Pod root.
    [rootContainer] = podRootAll;
  });

  afterEach(async () => {
    if (ws) {
      ws.disconnect();
    }
    await session.logout();
  });

  // The client library currently only supports the legacy ESS notifications protocol.
  // FIXME: When support for the latest protocol has been added, this should be removed
  // and the library should use the appropriate protocol depending on the environment.
  testIf(protocol === "ESS Notifications Protocol")(
    "can connect to a websocket on the root container",
    async () => {
      // The following is required because the linter doesn't recognize testIf
      /* eslint-disable jest/no-standalone-expect */
      ws = new WebsocketNotification(rootContainer, {
        gateway: notificationGateway,
        fetch: userAgentFetch,
      });

      expect(ws.status).toBe("closed");

      await ws.connect();
      await new Promise((resolve, reject) => {
        ws?.on("connected", () => {
          resolve(undefined);
        });
        ws?.on("error", (e: ErrorEvent) => {
          reject(e);
        });
      });

      expect(ws.status).toBe("connected");

      const events: Array<object> = [];
      ws.on("message", (message) => {
        events.push(message);
        // console.log(JSON.stringify(message, null, 2));
      });

      const createContainerMessage = nextWebsocketMessage(ws);
      // Wait for the container to be created and for the notification to be received
      const childContainer = await createContainerInContainer(rootContainer, {
        fetch: userAgentFetch,
      });

      await createContainerMessage;
      // One event should have been sent on the container creation
      expect(events).toHaveLength(1);

      const deleteContainerMessage = nextWebsocketMessage(ws);
      await deleteContainer(getSourceIri(childContainer), {
        fetch: userAgentFetch,
      });

      await deleteContainerMessage;

      // One additional event should have been sent on the container deletion
      expect(events).toHaveLength(2);

      ws.disconnect();

      await new Promise((resolve, reject) => {
        ws?.on("closed", () => {
          resolve(undefined);
        });
        ws?.on("error", (e: ErrorEvent) => {
          reject(e);
        });
      });

      expect(ws.status).toBe("closed");
    }
  );
});
