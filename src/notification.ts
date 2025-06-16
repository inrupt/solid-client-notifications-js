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

import { getIri, getThingAll, getWellKnownSolid } from "@inrupt/solid-client";
import { handleErrorResponse } from "@inrupt/solid-client-errors";

import { NotSupported } from "./errors";
import type {
  protocols,
  FeatureOptions,
  statuses,
  NotificationOptions,
  NegotiationInfo,
  NotificationConnectionInfo,
} from "./interfaces";

/**
 * @hidden
 */
export class BaseNotification {
  /** @internal */
  topic: string;

  /** @internal */
  gateway?: string;

  /** @internal */
  fetch?: typeof fetch;

  /** @internal */
  protocols: Array<protocols>;

  /** @internal */
  features: FeatureOptions;

  /** @internal */
  status: statuses = "closed";

  constructor(
    topic: string,
    protocolList: protocols[],
    options: NotificationOptions = {},
  ) {
    const { gateway, features = {}, fetch: fetchFn } = options;

    this.topic = topic;
    this.protocols = protocolList;
    this.features = features;
    this.gateway = gateway;

    // Load fetch:
    this.fetch = fetchFn;
  }

  /** @internal */
  async fetchNegotiationGatewayUrl(): Promise<string> {
    if (this.gateway) {
      return this.gateway;
    }

    const wellKnown = await getWellKnownSolid(this.topic, {
      fetch: this.fetch,
    }).catch((err: Error) => {
      // The storage server for the topic resource didn't respond well to
      // getWellKnownSolid requests:
      throw new NotSupported(err);
    });

    const wellKnownSubjects = getThingAll(wellKnown, {
      acceptBlankNodes: true,
    });
    const wellKnownSubject = wellKnownSubjects[0];

    // First try reading the 2.0 predicate:
    let notificationGateway = getIri(
      wellKnownSubject,
      "http://www.w3.org/ns/solid/terms#notificationGateway",
    );

    // Then try the earlier 1.1 predicate:
    if (!notificationGateway) {
      notificationGateway = getIri(
        wellKnownSubject,
        "http://inrupt.com/ns/ess#notificationGatewayEndpoint",
      );
    }

    // If we don't get either, then error out:
    if (!notificationGateway) {
      throw new NotSupported();
    }

    this.gateway = notificationGateway;
    return notificationGateway;
  }

  /** @internal */
  async fetchProtocolNegotiationInfo(): Promise<NegotiationInfo> {
    if (!this.gateway) {
      this.gateway = await this.fetchNegotiationGatewayUrl();
    }

    // Typescript doesn't notice that this.gateway was changed in fetchNegotiationGatewayUrl,
    // so we'll have to ignore it.
    /* eslint @typescript-eslint/ban-ts-comment: 0 */
    const response = await (this.fetch ?? fetch)(this.gateway, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        protocols: this.protocols,
        features: Object.keys(this.features),
      }),
    });

    if (response.status !== 200) {
      const responseBody = await response.text();
      throw handleErrorResponse(
        response,
        responseBody,
        "protocol negotiation info",
      );
    }

    return response.json();
  }

  /** @internal */
  async fetchNotificationConnectionInfo(): Promise<NotificationConnectionInfo> {
    const { endpoint } = await this.fetchProtocolNegotiationInfo();

    const response = await (this.fetch ?? fetch)(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: this.topic,
        ...this.features,
      }),
    });

    if (response.status !== 200) {
      const responseBody = await response.text();
      throw handleErrorResponse(response, responseBody, "connection info");
    }

    return response.json();
  }
}
