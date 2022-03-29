// Copyright 2021 Inrupt Inc.
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

import { ClientFunction } from "testcafe";
import { config } from "dotenv-flow";
import { essUserLogin } from "./roles";

// We re-use the test helpers from elsewhere, but we need to ignore the
// TypeScript error (TS6059) that complains about not all files being under the
// one 'rootDir'.
// @ts-ignore
import type { getHelpers } from "../../.codesandbox/sandbox/src/end-to-end-test-helpers";

// E2eHelpers is a global defined in .codesandbox/sandbox/src/end-to-end-helpers.
// Since code inside of ClientFunction is executed in that context in the browser,
// that variable is available to it - but as far as TypeScript is concerned,
// it is executed in the context of this test file.
// Hence, we just declare this variable to be of the same type here.
const E2eHelpers: ReturnType<typeof getHelpers> = {} as any;

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: __dirname,
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

fixture("End-to-end tests").page("https://localhost:1234/end-to-end-test.html");

const serversUnderTest: {
  gateway: string;
  identityProvider: string;
  username: string;
  password: string;
}[] = [
  // pod.inrupt.com:
  {
    // Cumbersome workaround, but:
    // Trim `https://` from the start of these URLs,
    // so that GitHub Actions doesn't replace them with *** in the logs.
    identityProvider: process.env.E2E_TEST_ESS_IDP_URL!.replace(
      /^https:\/\//,
      ""
    ),
    username: process.env.E2E_TEST_ESS_COGNITO_USER!,
    password: process.env.E2E_TEST_ESS_COGNITO_PASSWORD!,
    gateway: process.env.E2E_TEST_ESS_NOTIFICATION_GATEWAY!.replace(
      /^https:\/\//,
      ""
    ),
  },
  // dev-next.inrupt.com:
  {
    //   // Cumbersome workaround, but:
    //   // Trim `https://` from the start of these URLs,
    //   // so that GitHub Actions doesn't replace them with *** in the logs.
    identityProvider: process.env.E2E_TEST_DEV_NEXT_IDP_URL!.replace(
      /^https:\/\//,
      ""
    ),
    username: process.env.E2E_TEST_DEV_NEXT_COGNITO_USER!,
    password: process.env.E2E_TEST_DEV_NEXT_COGNITO_PASSWORD!,
    gateway: process.env.E2E_TEST_DEV_NEXT_NOTIFICATION_GATEWAY!.replace(
      /^https:\/\//,
      ""
    ),
  },
];

serversUnderTest.forEach((server) => {
  const { gateway } = server;
  // eslint-disable-next-line jest/expect-expect, jest/no-done-callback
  test("solid-client-notifications example functions", async (t: TestController) => {
    await essUserLogin(t);
    const connectWebsocket = ClientFunction((gateway) => {
      return E2eHelpers.connectWebsocket(`https://${gateway}`);
    });
    const notification = await connectWebsocket(gateway);

    await t.expect(notification.status).eql("connected", { timeout: 10000 });
  });
});
