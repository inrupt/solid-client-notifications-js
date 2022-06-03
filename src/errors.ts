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

export class FetchError extends Error {
  response: Response;

  constructor(
    url: string,
    statusCode: number,
    statusText: string,
    fetchDescription: string,
    response: Response
  ) {
    super(statusText);
    this.message = `Unable to fetch ${fetchDescription}: ${url} returned [${statusCode}] ${statusText}`;
    this.response = response;
  }
}

export class NotImplementedError extends Error {
  constructor(message = "Not implemented by base class") {
    super(message);
  }
}

export class NotSupported extends Error {
  cause?: Error;

  constructor(cause?: Error) {
    super("The server appears to not support notifications");
    if (cause) {
      this.message = `The server appears to not support notifications: ${cause.toString()}`;
      this.cause = cause;
    }
  }
}
