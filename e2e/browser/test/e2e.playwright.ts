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
  test,
  expect,
  WebSocket as PlayWrightWebSocket,
} from "@playwright/test";
import { getBrowserTestingEnvironment } from "@inrupt/internal-test-env";
import { loginAndAllow } from "@inrupt/internal-playwright-helpers";

const {
  notificationGateway,
  clientCredentials: {
    owner: { login, password },
  },
} = getBrowserTestingEnvironment({
  notificationGateway: true,
  clientCredentials: {
    owner: { login: true, password: true },
  },
});

test("connecting a websocket and disconnecting it", async ({ page }) => {
  let websocket: PlayWrightWebSocket;
  // Navigate to the test page and log in.
  await page.goto("/");
  await loginAndAllow(page, login, password);

  // Make sure we have a reference to the websocket that gets created.
  page.on("websocket", (ws) => {
    websocket = ws;
  });

  // The button is only displayed when the websocket can be created.
  await page.waitForSelector("button[data-testid=connectSocket]");

  // Connect the websocket. Note that the Promis.all prevents a race condition where
  // the request would be sent before we wait on it.
  await Promise.all([
    // Negotiate the protocol endpoint at the gateway
    page.waitForResponse(
      (response) => response.url() === new URL(notificationGateway).href
    ),
    // Connect to the endpoint
    page.waitForResponse(
      (response) => response.url() !== new URL(notificationGateway).href
    ),
    // The websocket should be created
    page.waitForEvent("websocket"),
    page.click("button[data-testid=connectSocket]"),
  ]);

  // Allow React to re-render the status after state update
  await page.waitForSelector("span[data-testid=webSocketStatus]");

  // Wait for the disconnect button to appear, as then we're really connected:
  await page.waitForSelector("button[data-testid=disconnectSocket]");

  await expect(
    page.innerText("span[data-testid=webSocketStatus]")
  ).resolves.toBe("connected");

  // Disconnect
  await page.click("button[data-testid=disconnectSocket]");

  await websocket.waitForEvent("close");

  await expect(
    page.innerText("span[data-testid=webSocketStatus]")
  ).resolves.toMatch("closed");
});

test("connecting a websocket, getting messages, and disconnecting it", async ({
  page,
}) => {
  let websocket: PlayWrightWebSocket;
  const framesReceived = [];
  // Navigate to the test page and log in.
  await page.goto("/");
  await loginAndAllow(page, login, password);

  // Make sure we have a reference to the websocket that gets created.
  page.on("websocket", (ws) => {
    websocket = ws;
    websocket.on("framereceived", (data) => {
      framesReceived.push(JSON.parse(data.payload.toString()));
    });
  });

  // The button is only displayed when the websocket can be created.
  await page.waitForSelector("button[data-testid=connectSocket]");

  // Connect the websocket. Note that the Promis.all prevents a race condition where
  // the request would be sent before we wait on it.
  await Promise.all([
    // Negotiate the protocol endpoint at the gateway
    page.waitForResponse(
      (response) => response.url() === new URL(notificationGateway).href
    ),
    // Connect to the endpoint
    page.waitForResponse(
      (response) => response.url() !== new URL(notificationGateway).href
    ),
    // The websocket should be created
    page.waitForEvent("websocket"),
    page.click("button[data-testid=connectSocket]"),
  ]);

  // Allow React to re-render the status after state update
  await page.waitForSelector("span[data-testid=webSocketStatus]");

  // Make sure the container can be created.
  await page.waitForSelector("button[data-testid=createContainer]");
  await Promise.all([
    // Wait for the resource creation
    page.waitForResponse((response) => response.status() === 201),
    // The resource creation should trigger a websocket frame
    websocket.waitForEvent("framereceived"),
    // Click the button to create the container:
    page.click("button[data-testid=createContainer]"),
  ]);

  expect(framesReceived).toHaveLength(1);
  expect(framesReceived[0]).toHaveProperty("id");
  expect(framesReceived[0].type).toContain("Update");

  // Wait for react to update the message list:
  await page.waitForSelector(
    `[data-testid=eventList] li:has-text("${framesReceived[0].id}")`
  );

  await expect(
    page.locator("[data-testid=eventList] li").count()
  ).resolves.toBe(1);

  // Make sure the container can be removed.
  await page.waitForSelector("button[data-testid=deleteContainer]");

  // Delete the created resource
  await Promise.all([
    // Wait for the resource deletion
    page.waitForResponse((response) => response.status() === 204),
    // The resource deletion should trigger a websocket frame
    websocket.waitForEvent("framereceived"),
    // Now wait for the delete click:
    page.click("button[data-testid=deleteContainer]"),
  ]);

  expect(framesReceived).toHaveLength(2);
  expect(framesReceived[1]).toHaveProperty("id");
  expect(framesReceived[1].type).toContain("Update");

  // Wait for react to update the message list:
  await page.waitForSelector(
    `[data-testid=eventList] li:has-text("${framesReceived[1].id}")`
  );

  await expect(
    page.locator("[data-testid=eventList] li").count()
  ).resolves.toBe(2);

  await page.click("button[data-testid=disconnectSocket]");
});
