:orphan:

====================================================
@inrupt/solid-client-notifications API Documentation
====================================================

`@inrupt/solid-client-notifications
<https://npmjs.com/package/@inrupt/solid-client-notifications>`__ is a
JavaScript library for subscribing to notifications sent by a Solid server.
These notifications may be sent synchronously or asynchronously.

For Solid Servers that support notifications, they are sent when a resource is
created, updated, deleted, or when a child resource is added to or removed from
a container.

.. admonition:: Supported Protocols
   :class: caution

   This library currently only supports an Inrupt `Enterprise Solid Server
   <https://docs.inrupt.com/ess/latest/>`__ version of `WebSocket
   notifications
   <https://docs.inrupt.com/ess/1.1/services/service-websocket/>`__.

   The ESS Websocket Notifications protocol formed the basis of the new `Solid
   Notification Protocol 1.0 <https://solid.github.io/notifications/protocol>`__
   draft specification, which is undergoing technical review as it matures into
   a formal recommendation.

   **Please note:** the `legacy WebSockets Specification
   <https://github.com/solid/solid-spec/blob/master/api-websockets.md>`__,
   referenced by the current `Solid Specification
   <https://solidproject.org/TR/protocol#live-update>`__, is not and will not
   be, supported by this library.

It is part of a `family open source JavaScript libraries
<https://docs.inrupt.com/developer-tools/javascript/client-libraries/>`__
designed to support developers building Solid applications.

Installation
------------

For the latest stable version of solid-client-notifications:

.. code:: bash

   npm install @inrupt/solid-client-notifications

Changelog
~~~~~~~~~

See `the release notes
<https://github.com/inrupt/solid-client-notifications-js/blob/main/CHANGELOG.md>`__.


Supported environments
~~~~~~~~~~~~~~~~~~~~~~

Our JavaScript Client Libraries use relatively modern JavaScript, aligned with
the `ES2018 <https://262.ecma-international.org/9.0/>`__ Specification features, we
ship both `ESM <https://nodejs.org/docs/latest-v16.x/api/esm.html>`__ and
`CommonJS <https://nodejs.org/docs/latest-v16.x/api/modules.html>`__, with type
definitions for TypeScript alongside.

This means that out of the box, we only support environments (browsers or
runtimes) that were released after mid-2018, if you wish to target other (older)
environments, then you will need to cross-compile our SDKs via the use of `Babel
<https://babeljs.io>`__, `webpack <https://webpack.js.org/>`__, `SWC
<https://swc.rs/>`__, or similar.

If you need support for Internet Explorer, it is recommended to pass them
through a tool like `Babel <https://babeljs.io>`__, and to add polyfills for
e.g. ``Map``, ``Set``, ``Promise``, ``Headers``, ``Array.prototype.includes``,
``Object.entries`` and ``String.prototype.endsWith``.

Node.js Support
^^^^^^^^^^^^^^^

See `Inrupt Solid Javascript Client Libraries
<https://docs.inrupt.com/developer-tools/javascript/client-libraries/#node-js-support>`__.

.. _issues--help:

Issues & Help
-------------

Solid Community Forum
~~~~~~~~~~~~~~~~~~~~~

If you have questions about working with Solid or just want to share what you're
working on, visit the `Solid forum <https://forum.solidproject.org/>`__. The
Solid forum is a good place to meet the rest of the community.

Bugs and Feature Requests
~~~~~~~~~~~~~~~~~~~~~~~~~

-  For public feedback, bug reports, and feature requests please file an issue
   via `Github
   <https://github.com/inrupt/solid-client-notifications-js/issues/>`__.
-  For non-public feedback or support inquiries please use the `Inrupt Service
   Desk <https://inrupt.atlassian.net/servicedesk>`__.


API Documentation
-----------------

Modules
~~~~~~~

.. toctree::
   :glob:
   :titlesonly:

   /modules/**

Classes
~~~~~~~~~~

.. toctree::
   :glob:
   :titlesonly:

   /classes/**

Interfaces
~~~~~~~~~~

.. toctree::
   :glob:
   :titlesonly:

   /interfaces/**
