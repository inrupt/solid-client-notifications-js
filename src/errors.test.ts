// Copyright 2020 Inrupt Inc.
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

import { test, describe, expect } from "@jest/globals";

import { FetchError, NotImplementedError, NotSupported } from "./errors";

describe("FetchError", () => {
  test("bad request error", () => {
    const response = new Response("400 Bad Request", {
      status: 400,
      statusText: "Bad Request",
      headers: {
        "Content-Type": "text/plain",
      },
    });
    const err = new FetchError(
      "https://example.test/resource",
      400,
      "Bad Request",
      "Sample description",
      response,
    );

    const msg =
      "Unable to fetch Sample description: https://example.test/resource returned [400] Bad Request";

    expect(err.message).toEqual(msg);
    expect(err.response).toEqual(response);
  });
});

describe("NotImplementedError", () => {
  test("default constructor", () => {
    const err = new NotImplementedError();
    expect(err.message).toBe("Not implemented by base class");
  });

  test("custom message", () => {
    const msg = "custom error message";
    const err = new NotImplementedError(msg);
    expect(err.message).toEqual(msg);
  });
});

describe("NotSupported", () => {
  test("default constructor", () => {
    const err = new NotSupported();
    expect(err.cause).toBeUndefined();
  });

  test("user-defined error", () => {
    const cause = new NotImplementedError();
    const err = new NotSupported(cause);
    expect(err.cause).toEqual(cause);
  });
});
