# Twitter Relay Service

This project will connect to the Twitter API streaming endpoint
for the configured application and provide an authenticated web
socket connection to relay the stream to one or more downstream
consumers (see `@guahanweb/twitter-relay-consumer`).

**NOTE:** this project is not intended for broad usage and is
only designed as a case study for a workshop during
[All Things Open 2022](https://www.allthingsopen.org).

## Options

The following environment variables may be set to adjust behavior:

* `BEARER_TOKEN` - **REQUIRED:** your *Twitter API* token
* `AUTH_TOKEN` - an authorization header string on which to match inbound upgrade requests (defaults to `testing`)
* `HOST` - the host name on which to listen (defaults to `localhost`)
* `PORT` - the port on which to listen (defaults to `3000`)
* `LOG_LEVEL` - reporting level for logs (defaults to `debug`)

## Authorization

In order to connect to your relay service, your consumer must provide
a bearer token authorization header for the upgrade request. This token
must be the **base64 encoded version** of your `AUTH_TOKEN` option.

**Example:**

```
POST /connect
Authorization bearer <base64:testing>
```
