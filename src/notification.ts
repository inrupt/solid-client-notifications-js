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

import { fetch as crossFetch } from "cross-fetch";
import { getIri, getThingAll, getWellKnownSolid } from "@inrupt/solid-client";

import { FetchError, NotSupported } from "./errors";
import {
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
  fetchLoaded = true;

  /** @internal */
  fetchLoader?: Promise<void>;

  /** @internal */
  topic: string;

  /** @internal */
  gateway?: string;

  /** @internal */
  fetch: typeof crossFetch;

  /** @internal */
  protocols: Array<protocols>;

  /** @internal */
  features: FeatureOptions;

  /** @internal */
  status: statuses = "closed";

  // Dynamically import solid-client-authn-browser so that Notification doesn't have a hard
  // dependency.
  /* eslint consistent-return: 0 */
  /** @internal */
  static async getDefaultSessionFetch(): Promise<
    typeof crossFetch | undefined
  > {
    try {
      const { fetch: fetchFn } = await import(
        "@inrupt/solid-client-authn-browser"
      );

      return fetchFn;
    } catch (e) {
      /* empty */
    }
  }

  constructor(
    topic: string,
    protocolList: protocols[],
    options: NotificationOptions = {}
  ) {
    const { gateway, features = {}, fetch: fetchFn } = options;

    this.topic = topic;
    this.protocols = protocolList;
    this.features = features;
    this.gateway = gateway;

    // Load fetch:
    this.fetch = fetchFn || crossFetch;
    if (!fetchFn) {
      this.fetchLoaded = false;
      this.fetchLoader = BaseNotification.getDefaultSessionFetch()
        .then((defaultFetchFn) => {
          if (defaultFetchFn) this.fetch = defaultFetchFn;
        })
        .catch(() => {})
        .finally(() => {
          this.fetchLoaded = true;
        });
    }
  }

  /** @internal */
  async fetchNegotiationGatewayUrl(): Promise<string> {
    if (this.gateway) {
      return this.gateway;
    }

    const wellKnown = await getWellKnownSolid(this.topic).catch(
      (err: Error) => {
        // The storage server for the topic resource didn't respond well to
        // getWellKnownSolid requests:
        throw new NotSupported(err);
      }
    );

    const wellKnownSubjects = getThingAll(wellKnown, {
      acceptBlankNodes: true,
    });
    const wellKnownSubject = wellKnownSubjects[0];

    // First try reading the 2.0 predicate:
    let notificationGateway = getIri(
      wellKnownSubject,
      "http://www.w3.org/ns/solid/terms#notificationGateway"
    );

    // Then try the earlier 1.1 predicate:
    if (!notificationGateway) {
      notificationGateway = getIri(
        wellKnownSubject,
        "http://inrupt.com/ns/ess#notificationGatewayEndpoint"
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
    if (!this.fetchLoaded) {
      await this.fetchLoader;
    }

    if (!this.gateway) {
      this.gateway = await this.fetchNegotiationGatewayUrl();
    }

    // Typescript doesn't notice that this.gateway was changed in fetchNegotiationGatewayUrl,
    // so we'll have to ignore it.
    /* eslint @typescript-eslint/ban-ts-comment: 0 */
    // @ts-ignore
    const response = await this.fetch(this.gateway, {
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
      throw new FetchError(
        response.url,
        response.status,
        response.statusText,
        "protocol negotiation info",
        response
      );
    }

    return response.json();
  }

  /** @internal */
  async fetchNotificationConnectionInfo(): Promise<NotificationConnectionInfo> {
    if (!this.fetchLoaded) {
      await this.fetchLoader;
    }

    const { endpoint } = await this.fetchProtocolNegotiationInfo();

    const response = await this.fetch(endpoint, {
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
      throw new FetchError(
        response.url,
        response.status,
        response.statusText,
        "connection info",
        response
      );
    }

    return response.json();
  }
}
