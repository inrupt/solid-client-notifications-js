# Solid Notifications - solid-client-notifications

@inrupt/solid-client-notifications is a Javascript library for subscribing to
notifications. It allows your application to subscribe to resources, receiving
events as resources change. You can use these in Node.js using either
CommonJS or ES modules, and in the browser with a bundler like Webpack, Rollup,
or Parcel.

@inrupt/solid-client-notifications is part of a family open source JavaScript
libraries designed to support developers building Solid applications.

# Browser support

Our JavaScript Client Libraries use relatively modern JavaScript features that
will work in all commonly-used browsers, except Internet Explorer. If you need
support for Internet Explorer, it is recommended to pass them through a tool
like [Babel](https://babeljs.io), and to add polyfills for e.g. `Map`, `Set`,
`Promise`, `Headers`, `Array.prototype.includes`, `Object.entries` and
`String.prototype.endsWith`.

# Node support

Our JavaScript Client Libraries track Node.js LTS releases, and support 14.x,
and 16.x.

# Installation

For the latest stable version of solid-client-notifications:

```bash
npm install @inrupt/solid-client-notifications
```

For the latest stable version of all Inrupt Solid JavaScript libraries:

```bash
npm install @inrupt/solid-client @inrupt/solid-client-authn-browser @inrupt/vocab-common-rdf @inrupt/solid-client-notifications
```

# Issues & Help

## Solid Community Forum

If you have questions about working with Solid or just want to share what you’re
working on, visit the [Solid forum](https://forum.solidproject.org/). The Solid
forum is a good place to meet the rest of the community.

## Bugs and Feature Requests

- For public feedback, bug reports, and feature requests please file an issue
  via [Github](https://github.com/inrupt/solid-client-notifications-js/issues/).
- For non-public feedback or support inquiries please use the
  [Inrupt Service Desk](https://inrupt.atlassian.net/servicedesk).

## Documentation

- [Subscribe to WebSocket Notifications](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/subscribe-to-notifications/)
- [Inrupt Solid Javascript Client Libraries](https://docs.inrupt.com/developer-tools/javascript/client-libraries/)
- [Homepage](https://docs.inrupt.com/)

# Changelog

See [the release notes](https://github.com/inrupt/solid-client-notifications-js/blob/main/CHANGELOG.md).

# License

MIT © [Inrupt](https://inrupt.com)
