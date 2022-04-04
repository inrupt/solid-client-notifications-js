/**
 * Copyright 2022 Inrupt Inc.
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

/* eslint-disable jest/no-done-callback */

// eslint-disable-next-line no-shadow
import { test, expect, WebSocket as PlayWrigtWebSocket } from "@playwright/test";
import { essUserLogin } from "./roles";

import { getTestingEnvironmentBrowser } from "../../e2e-setup";

const { login, password, notificationGateway } = getTestingEnvironmentBrowser();

test.skip("connecting a websocket and disconnecting it", async ({ page }) => {
  let websocket: PlayWrigtWebSocket;
  // Navigate to the test page and log in.
  await page.goto("/");
  await essUserLogin(page, login, password);

  // Make sure we have a reference to the websocket that gets created.
  page.on("websocket", (ws) => {
    websocket = ws;
  })

  // The button is only displayed when the websocket can be created.
  await page.waitForSelector("button[data-testid=connectSocket]")

  // Connect the websocket. Note that the Promis.all prevents a race condition where
  // the request would be sent before we wait on it.
  await Promise.all([
    // Negotiate the protocol endpoint at the gateway
    page.waitForResponse((response) => response.url() === (new URL(notificationGateway)).href),
    // Connect to the endpoint
    page.waitForResponse((response) => response.url() !== (new URL(notificationGateway)).href),
    // The websocket should be created
    page.waitForEvent("websocket"),
    page.click("button[data-testid=connectSocket]"),
  ]);

  // Allow React to re-render the status after state update
  await page.waitForSelector("span[data-testid=webSocketStatus]")

  await expect(
    page.innerText("span[data-testid=webSocketStatus]")
  ).resolves.toBe("connected");

  // Disconnect
  await Promise.all([
    page.click("button[data-testid=disconnectSocket]"),
  ]);

  await websocket.waitForEvent("close");
  
  await expect(
    page.innerText("span[data-testid=webSocketStatus]")
  ).resolves.toMatch("closed");
});

test("connecting a websocket, getting messages, and disconnecting it", async ({ page }) => {
  let websocket: PlayWrigtWebSocket;
  // Navigate to the test page and log in.
  await page.goto("/");
  await essUserLogin(page, login, password);

  // Make sure we have a reference to the websocket that gets created.
  page.on("websocket", (ws) => {
    websocket = ws;
  })

  // The button is only displayed when the websocket can be created.
  await page.waitForSelector("button[data-testid=connectSocket]")

  // Connect the websocket. Note that the Promis.all prevents a race condition where
  // the request would be sent before we wait on it.
  await Promise.all([
    // Negotiate the protocol endpoint at the gateway
    page.waitForResponse((response) => response.url() === (new URL(notificationGateway)).href),
    // Connect to the endpoint
    page.waitForResponse((response) => response.url() !== (new URL(notificationGateway)).href),
    // The websocket should be created
    page.waitForEvent("websocket"),
    page.click("button[data-testid=connectSocket]"),
  ]);

  // Make sure the container can be created.
  await page.waitForSelector("button[data-testid=createContainer]");
  await Promise.all([
    // Wait for the resource creation
    page.waitForResponse((response) => response.status() === 201),
    // The resource creation should trigger a websocket frame
    websocket.waitForEvent("framereceived"),
    page.click("button[data-testid=createContainer]"),
  ]);

  // Waiting on the framereceived event ensures that the websocket receives events
  // when resources are created.

  // Make sure the container can be removed.
  await page.waitForSelector("button[data-testid=deleteContainer]");

  // Clean up
  await Promise.all([
    page.click("button[data-testid=deleteContainer]"),
    page.click("button[data-testid=disconnectSocket]")
  ]);
});
