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

   This library currently only supports an `early version of WebSocket
   notifications
   <https://docs.inrupt.com/ess/1.1/services/service-websocket/>`__, which
   formed the basis of the Solid Notification Protocol 1.0 draft specification,
   which is undergoing technical review as it matures into a formal
   recommendation. A future release of this library will support this draft
   specification once server implementations become available. 
   
   **Please note:** the `legacy WebSockets Specification
   <https://github.com/solid/solid-spec/blob/master/api-websockets.md>`__, is
   not, and will not be, supported by this library.

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


Browser Support
~~~~~~~~~~~~~~~

Our JavaScript Client Libraries use relatively modern JavaScript features that
will work in all commonly-used browsers, except Internet Explorer. If you need
support for Internet Explorer, it is recommended to pass them through a tool
like `Babel <https://babeljs.io>`__, and to add polyfills for e.g. ``Map``,
``Set``, ``Promise``, ``Headers``, ``Array.prototype.includes``,
``Object.entries`` and ``String.prototype.endsWith``.

Additionally, when using this package in an environment other than Node.js, you
will need `a polyfill for Node's buffer module
<https://www.npmjs.com/package/buffer>`__.

Node.js Support
~~~~~~~~~~~~~~~

Our JavaScript Client Libraries track Node.js `LTS releases
<https://nodejs.org/en/about/releases/>`__, and support 12.x, 14.x, and 16.x.

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
