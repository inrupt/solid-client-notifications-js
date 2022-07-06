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
import { test, describe, expect, jest } from "@jest/globals";

import EventEmitter from "events";
import { LiveNotification } from "./liveNotification";
import { protocols } from "./interfaces";

describe("LiveNotification", () => {
  test("has an EventEmitter", () => {
    const topic = "https://fake.url/some-resource";
    const protocol = ["ws"] as Array<protocols>;
    const notification = new LiveNotification(topic, protocol);

    expect(notification.emitter).toBeInstanceOf(EventEmitter);
  });

  test("throws an error on unimplemented connect", () => {
    const topic = "https://fake.url/some-resource";
    const protocol = ["ws"] as Array<protocols>;
    const notification = new LiveNotification(topic, protocol);

    expect(notification.connect).toThrow("Not implemented");
    expect(notification.status).toBe("closed");
  });

  test("throws an error on unimplemented disconnect", () => {
    const topic = "https://fake.url/some-resource";
    const protocol = ["ws"] as Array<protocols>;
    const notification = new LiveNotification(topic, protocol);

    expect(notification.disconnect).toThrow("Not implemented");
    expect(notification.status).toBe("closed");
  });

  test("on forwards events from the eventemitter until off is called", () => {
    const topic = "https://fake.url/some-resource";
    const protocol = ["ws"] as Array<protocols>;
    const notification = new LiveNotification(topic, protocol);

    const channel = "message";
    const message = "hello";
    const onFn = jest.fn();

    notification.on(channel, onFn);

    notification.emitter.emit(channel, message);

    expect(onFn).toHaveBeenCalledWith(message);
    expect(onFn).toHaveBeenCalledTimes(1);

    notification.emitter.emit(channel, message);
    expect(onFn).toHaveBeenCalledTimes(2);

    notification.off(channel, onFn);
    notification.emitter.emit(channel, message);
    expect(onFn).toHaveBeenCalledTimes(2);
  });
  test("once forwards events from the eventemitter once", () => {
    const topic = "https://fake.url/some-resource";
    const protocol = ["ws"] as Array<protocols>;
    const notification = new LiveNotification(topic, protocol);

    const channel = "message";
    const message = "hello";
    const onFn = jest.fn();

    notification.once(channel, onFn);

    notification.emitter.emit(channel, message);

    expect(onFn).toHaveBeenCalledWith(message);
    expect(onFn).toHaveBeenCalledTimes(1);

    notification.emitter.emit(channel, message);
    expect(onFn).toHaveBeenCalledTimes(1);
  });
});
