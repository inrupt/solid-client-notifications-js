# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

The following changes have been implemented but not released yet:

### Breaking change

- `FetchError` is no longer thrown, and replaced with `ClientHttpError`. Please prefer using type guards from `@inrupt/solid-client-errors`, e.g. `hasErrorResponse` and `hasProblemDetails`, rather than `instanceof`.

### New Features

- Node 22 is now supported
- `ClientHttpError` is thrown on HTTP error. It implements `WithErrorResponse` and `WithProblemDetails`,
  meaning it has respectively `.errorResponse` and `.problemDetails` getters. The former provides
  access to the raw HTTP response, and the latter to structured data about the error compliant with
  [RFC9457](https://www.rfc-editor.org/rfc/rfc9457).

# [2.0.0](https://github.com/inrupt/solid-client-notifications-js/releases/tag/v2.0.0) - 2023-12-20

### Breaking changes

- `setSessionFetch` is no longer supported. Please provide a `Session` to the `BaseNotification`
  (or child classes) constructor instead.
- The default session fetch from `@inrupt/solid-client-authn-browser` is no longer loaded lazily.
  The intended fetch should be provided explicitly.
- Due to changes in the rollup config the `umd` output is now found at `dist/index.umd.js` rather than `umd/index.js`.
  The UMD module name is now `SolidClientNotifications` instead of `SolidClient`.

## [1.3.1] - 2023-09-15

- Build system (bundler and TypeScript) updates. This should be transparent to dependants.

## [1.3.0] - 2023-05-09

### New features

- Node 20 is now officially supported

## [1.2.0] - 2023-04-14

### New features

- Node 18 is now officially supported

## [1.1.2] - 2023-02-16

### Bugfixes

- Transitive dependencies updates

## [1.1.1] - 2022-08-19

### Bugfixes

- Always pass through fetch from BaseNotification to `getWellKnownSolid`, such
  that `@inrupt/solid-client` doesn't have to load its own fetch implementation.

## [1.1.0] - 2022-07-01

### New Features

- LiveNotification now supports `once` and `off` events.

## [1.0.0] - 2022-06-06

### Breaking Changes

- Support for Node.js v12.x has been dropped as that version has reached end-of-life.

### New Features

- WebsocketNotification `message` events are now parsed as JSON, this is technically a breaking change but we're allowing it due to the alpha nature of this library.

### Fixes

- use `getWellKnownSolid` from `@inrupt/solid-client` to be more compatible/reliable
- improve documentation of entire package to be clearer and document only APIs that should be used by end-users of the SDK.
- rework all tests to run successfully

## [0.2.0] - 2021-12-15

### Changes

- Request .well-known file as json-ld

## [0.1.0] - 2021-04-20

### New features

- Initial implementation of WebsocketNotification
