//
// Copyright Inrupt Inc.
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

import { describe, it, expect, afterEach, beforeEach } from "@jest/globals";

import type { Session } from "@inrupt/solid-client-authn-node";
import {
  createContainerInContainer,
  deleteContainer,
  getSourceIri,
} from "@inrupt/solid-client";
import {
  getNodeTestingEnvironment,
  getAuthenticatedSession,
  getPodRoot,
  setupTestResources,
  teardownTestResources,
  createFetch,
} from "@inrupt/internal-test-env";
import type { ErrorEvent } from "../../src/index";
import { WebsocketNotification } from "../../src/index";

const env = getNodeTestingEnvironment();

const TEST_SLUG = "solid-client-notifications-test-e2e-resource";

if (process.env.CI === "true") {
  // Tests running in the CI runners tend to be more flaky.
  jest.retryTimes(3, { logErrorsBeforeRetry: true });
}

const nextWebsocketMessage = async (ws: WebsocketNotification) => {
  return new Promise((resolve) => {
    // TODO: implement ws.once
    ws?.emitter?.once("message", (payload: object) => {
      resolve(payload);
    });
  });
};

describe(`Authenticated end-to-end notifications tests for environment [${env.environment}}]`, () => {
  // Lots of requests being made; we'll give it some extra time.
  // jest.setTimeout(15000);
  // openidClient.custom.setHttpOptionsDefaults({ timeout: 5000 });
  let fetchOptions: { fetch: typeof global.fetch };
  let session: Session;
  let pod: string;
  let sessionContainer: string;
  let sessionResource: string;

  let ws: WebsocketNotification | undefined;

  beforeEach(async () => {
    session = await getAuthenticatedSession(env);
    fetchOptions = { fetch: createFetch(session, TEST_SLUG) };
    pod = await getPodRoot(session);
    const testsetup = await setupTestResources(pod, fetchOptions);

    sessionResource = testsetup.resourceUrl;
    sessionContainer = testsetup.containerUrl;
  });

  afterEach(async () => {
    if (ws) {
      ws.disconnect();
    }
    await teardownTestResources(
      session,
      sessionContainer,
      sessionResource,
      fetchOptions
    );
  });

  it("can connect to a websocket on the root container", async () => {
    // The following is required because the linter doesn't recognize testIf
    /* eslint-disable jest/no-standalone-expect */
    ws = new WebsocketNotification(sessionContainer, fetchOptions);

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
    });

    const createContainerMessage = nextWebsocketMessage(ws);
    // Wait for the container to be created and for the notification to be received
    const childContainer = await createContainerInContainer(
      sessionContainer,
      fetchOptions
    );

    await createContainerMessage;
    // One event should have been sent on the container creation
    expect(events).toHaveLength(1);

    const deleteContainerMessage = nextWebsocketMessage(ws);
    await deleteContainer(getSourceIri(childContainer), fetchOptions);

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
  });
});
