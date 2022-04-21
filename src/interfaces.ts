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

export type protocols = "ws" | string;
export type statuses = "connecting" | "connected" | "closing" | "closed";

/** @hidden */
export interface NegotiationInfo {
  endpoint: string;
  protocol: protocols;
  features: FeatureOptions;
}

/** @hidden */
export interface NotificationConnectionInfo {
  endpoint: string;
  protocol: protocols;
  subprotocol: string;
}

export interface NotificationOptions {
  features?: FeatureOptions;
  /**
   * Automatically discovered based on the topic passed
   */
  gateway?: string;
  /**
   * Automatically discovered based on the topic passed
   */
  host?: string;

  /**
   * A WHATWG Fetch API compatible function used when making requests for
   * discovering metadata for notifications. See the documentation for
   * `setSessionFetch` in the `WebsocketNotification` class.
   */
  fetch?: typeof crossFetch;
}

export interface FeatureOptions {
  state?: string;
  ttl?: number;
  rate?: number;
  filter?: string;
}
