# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

The following changes have been implemented but not released yet:

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
