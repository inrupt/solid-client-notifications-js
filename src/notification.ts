/**
 * Copyright 2021 Inrupt Inc.
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

import { UrlString } from "@inrupt/solid-client";
import { FetchError } from "./errors";

export type protocols = "ws";

export type features = "state" | "ttl" | "rate" | "filter";
export type statuses = "connecting" | "connected" | "closing" | "closed";

export type NegotiationInfo = {
  endpoint: UrlString;
  procotol: protocols;
  features: Features;
};

export type NotificationConnectionInfo = {
  endpoint: UrlString;
  protocol: protocols;
  subprotocol: string;
};

export type BaseNotificationOptions = {
  features?: Features;
  gateway?: UrlString;
  host?: UrlString;
};

export type Features = {
  state?: string;
  ttl?: number;
  rate?: number;
  filter?: string;
};

export default class BaseNotification {
  topic: UrlString;

  host: UrlString;

  gateway?: UrlString;

  fetch: typeof window.fetch;

  protocols: Array<protocols>;

  features: Features;

  status: statuses = "closed";

  /** @internal */
  static getRootDomain(topic: UrlString): UrlString {
    const parsedUrl = new URL(topic);
    return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  }

  /** @internal */
  static getSolidWellKnownUrl(host: UrlString): UrlString {
    return new URL("/.well-known/solid", host).href;
  }

  constructor(
    topic: UrlString,
    fetchFn: typeof window.fetch,
    protocolList: protocols[],
    options: BaseNotificationOptions = {}
  ) {
    this.topic = topic;
    this.fetch = fetchFn;
    this.protocols = protocolList;
    this.features = options.features || {};
    this.gateway = options.gateway;

    this.host = options.host || BaseNotification.getRootDomain(topic);
  }

  /** @internal */
  async fetchNegotiationGatewayUrl(): Promise<string> {
    if (this.gateway) {
      return this.gateway;
    }

    const response = await this.fetch(
      BaseNotification.getWellKnownUrl(this.host)
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

  async fetchProtocolNegotationInfo(): Promise<NegotiationInfo> {
    if (!this.gateway) {
      await this.fetchNegotiationGatewayUrl();
    }

    // Typescript doesn't notice that this.gateway was changed in fetchNegotiationGatewayUrl,
    // so we'll have to ignore it.
    // Also, this initial request is unauthenticated; use the global fetch.
    /* eslint @typescript-eslint/ban-ts-comment: 0 */
    // @ts-ignore
    const response = await fetch(this.gateway, {
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
    const { endpoint } = await this.fetchProtocolNegotationInfo();

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
