// Copyright 2022 Inrupt Inc.
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

import { fetch as crossFetch } from "cross-fetch";
import { FetchError } from "./errors";

export type protocols = "ws" | string;
export type statuses = "connecting" | "connected" | "closing" | "closed";

export type NegotiationInfo = {
  endpoint: string;
  procotol: protocols;
  features: FeatureOptions;
};

export type NotificationConnectionInfo = {
  endpoint: string;
  protocol: protocols;
  subprotocol: string;
};

export type BaseNotificationOptions = {
  features?: FeatureOptions;
  gateway?: string;
  host?: string;
  fetch?: typeof crossFetch;
};

export type FeatureOptions = {
  state?: string;
  ttl?: number;
  rate?: number;
  filter?: string;
};

export class BaseNotification {
  topic: string;

  host: string;

  gateway?: string;

  fetch: typeof crossFetch;

  protocols: Array<protocols>;

  features: FeatureOptions;

  status: statuses = "closed";

  /** @internal */
  static getRootDomain(topic: string): string {
    const parsedUrl = new URL(topic);
    return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  }

  /** @internal */
  static getSolidWellKnownUrl(host: string): string {
    return new URL("/.well-known/solid", host).href;
  }

  // Dynamically import solid-client-authn-browser so that Notifiction doesn't have a hard
  // dependency.
  /* eslint consistent-return: 0 */
  static async getDefaultSessionFetch(): Promise<
    typeof crossFetch | undefined
  > {
    try {
      const { fetch: fetchFn } = await import(
        "@inrupt/solid-client-authn-browser"
      );

      return fetchFn;
      /* eslint no-empty: 0 */
    } catch (e) {}
  }

  constructor(
    topic: string,
    protocolList: protocols[],
    options: BaseNotificationOptions = {}
  ) {
    const { gateway, host, features = {}, fetch: fetchFn } = options;

    this.topic = topic;
    this.protocols = protocolList;
    this.features = features;
    this.gateway = gateway;
    this.fetch = fetchFn || crossFetch;

    // Attempt to load the fetch function from the default session if no fetchFn was passed in.
    if (!fetchFn) {
      // We don't care if this errors.
      /* eslint @typescript-eslint/no-floating-promises: 0 */
      BaseNotification.getDefaultSessionFetch().then(this.setSessionFetch);
    }

    this.host = host || BaseNotification.getRootDomain(topic);
  }

  setSessionFetch = (sessionFetch: typeof crossFetch = crossFetch): void => {
    this.fetch = sessionFetch;
  };

  /** @internal */
  async fetchNegotiationGatewayUrl(): Promise<string> {
    if (this.gateway) {
      return this.gateway;
    }

    const response = await this.fetch(
      BaseNotification.getSolidWellKnownUrl(this.host),
      {
        headers: {
          Accept: "application/ld+json",
        },
      }
    );

    if (response.status !== 200) {
      throw new FetchError(
        response.url,
        response.status,
        response.statusText,
        "negotiation gateway url",
        response
      );
    }

    const { notificationGateway } = await response.json();

    this.gateway = notificationGateway;
    return notificationGateway;
  }

  async fetchProtocolNegotiationInfo(): Promise<NegotiationInfo> {
    if (!this.gateway) {
      await this.fetchNegotiationGatewayUrl();
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

  async fetchNotificationConnectionInfo(): Promise<NotificationConnectionInfo> {
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
