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

import { EventEmitter } from "events";
import { NotImplementedError } from "./errors";

import { BaseNotification } from "./notification";
import { NotificationOptions, protocols } from "./interfaces";

export declare interface LiveNotification {
  on(eventName: string, listener: (...args: any[]) => void): this;
  once(eventName: string, listener: (...args: any[]) => void): this;
  off(eventName: string, listener: (...args: any[]) => void): this;
}

/**
 * @hidden
 */
export class LiveNotification extends BaseNotification {
  /** @internal */
  protocol?: protocols;

  /** @hidden */
  emitter: EventEmitter;

  // TODO move constructor options to options instead of arguments
  constructor(
    topic: string,
    protocolList: protocols[],
    options?: NotificationOptions
  ) {
    super(topic, protocolList, options);
    this.emitter = new EventEmitter();
  }

  connect = (): void => {
    this.status = "closed";
    throw new NotImplementedError();
  };

  disconnect = (): void => {
    this.status = "closed";
    throw new NotImplementedError();
  };

  /* eslint @typescript-eslint/no-explicit-any: 0 */
  on(eventName: string, listener: (...args: any[]) => void): this {
    this.emitter.on(eventName, listener);
    return this;
  }

  /* eslint @typescript-eslint/no-explicit-any: 0 */
  once(eventName: string | symbol, listener: (...args: any[]) => void): this {
    this.emitter.once(eventName, listener);
    return this;
  }

  /* eslint @typescript-eslint/no-explicit-any: 0 */
  off(eventName: string, listener: (...args: any[]) => void): this {
    this.emitter.off(eventName, listener);
    return this;
  }
}
