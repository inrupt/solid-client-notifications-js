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

import { Session } from "@inrupt/solid-client-authn-node";
import {
  createContainerInContainer,
  createSolidDataset,
  deleteSolidDataset,
  getPodUrlAll,
  getSourceIri,
  saveSolidDatasetInContainer,
} from "@inrupt/solid-client";

import { TestingEnvironmentNode } from "../utils/getTestingEnvironment";

export async function getAuthenticatedSession(
  authDetails: TestingEnvironmentNode
): Promise<Session> {
  const session = new Session();
  await session.login({
    oidcIssuer: authDetails.idp,
    clientId: authDetails.clientId,
    clientName:
      "Solid Client Notifications End-2-End Test Client App - Node.js",
    clientSecret: authDetails.clientSecret,
  });

  if (!session.info.isLoggedIn) {
    throw new Error("Logging the test agent in failed.");
  }

  return session;
}

export async function getPodRoot(session: Session) {
  const podRootAll = await getPodUrlAll(session.info.webId as string);
  if (podRootAll.length === 0) {
    throw new Error(
      `No Pod root were found in the profile associated to [${session.info.webId}]`
    );
  }

  // Arbitrarily pick one available Pod root.
  return podRootAll[0];
}

export async function setupTestResources(
  session: Session,
  slug: string,
  podRoot: string
) {
  // Set the user agent to something distinctive to make debug easier
  const fetchWithAgent: typeof fetch = (url, options?) => {
    return session.fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        "User-Agent": slug,
      },
    });
  };
  const containerUrl = getSourceIri(
    await createContainerInContainer(podRoot, {
      fetch: fetchWithAgent,
      // When running the test from CI, use a random container name to avoid collision.
      // It could be useful to give the container a distinctive name when running the
      // tests locally though, so that the Pod is easier to inspect.
      slugSuggestion: process.env.CI === "true" ? undefined : slug,
    })
  );
  const resourceUrl = getSourceIri(
    await saveSolidDatasetInContainer(containerUrl, createSolidDataset(), {
      fetch: fetchWithAgent,
    })
  );
  return { containerUrl, resourceUrl, fetchWithAgent };
}

export async function teardownTestResources(
  session: Session,
  containerUrl: string,
  resourceUrl: string,
  userAgentFetch: typeof fetch
) {
  await deleteSolidDataset(resourceUrl, { fetch: userAgentFetch });
  await deleteSolidDataset(containerUrl, { fetch: userAgentFetch });
  await session.logout();
}
