# Motivation

This plugin adds functionality to access [pgMemento](https://github.com/pgMemento/pgMemento)'s audit data on an entity level from a [postgraphile](https://www.graphile.org/postgraphile/) graphql api.

Each Entity for an audited table can be extended automatically with the following properties:

```graphql
interface Audited {
  firstAuditEvent: AuditEvent!
  lastAuditEvent: AuditEvent!
  createdAt: String!
  lastModifiedAt: String!
  createdBy: String!
  lastModifiedBy: String!
  auditEvents(
    first: Int
    last: Int
    offset: Int
    before: Cursor
    after: Cursor
  ): AuditEventsConnection!
}

interface AuditEvent {
  id: BigInt
  auditId: BigInt
  eventId: Int
  transactionId: Int
  userName: String
  stmtDate: Datetime
  sessionInfo: JSON
  valuesBefore: JSON
  valuesAfter: JSON
}
```

Properties can be renamed using inflection and their presence can be configured.

# Installation

```sh
npm install postgraphile-audit-plugin
# this will ask you for a target schema and then create the `AuditEvent` type and `get_audit_information` function.
psql -h host -p 5432 -U user -d database -f Setup.sql
```

# Usage

The plugin comes preconfigured out of the box. It can be configured using a `.postgraphilerc.js`:

```js
/**
 * @type {import("./src").AuditPluginOptions}
 */
const auditPlugin = {
  /**
   * name of the schema that contains the `get_audit_information` function
   */
  auditFunctionSchema: "public",

  /**
   * include "auditEvents" connection on audited types
   */
  auditEventConnection: true,

  /**
   * include "firstAuditEvent" and "lastAuditEvent" field on audited types
   */
  firstLastAuditEvent: true,

  /**
   * include "createdAt" and "lastModifiedAt" field on audited types
   */
  dateProps: true,

  /**
   * include "createdBy" and "lastModifiedBy" on audited types
   */
  nameProps: true,

  /**
   * define how "name" properties should be filled - either with the transaction's "user_name", or with a value from the "session_info" JSON
   * can be "user_name" or "session_info";
   */
  nameSource: "session_info",

  /**
   * if `nameSource` is "session_info", this describes the path to the username within the JSON
   * e.g. "{name}" or "{nested,user,name}" (see the #>> notation described in https://www.postgresql.org/docs/9.3/functions-json.html)
   */
  nameSessionInfoJsonPath: "{nested,name}",

  /**
   * if name cannot be filled (because it is null or undefined), fall back to this value
   */
  nameFallback: "unknown user",
};

module.exports = {
  options: {
    graphileBuildOptions: {
      auditPlugin,
    },
  },
};
```

# Extracting the user name from a JWT and writing it to `session_info`

You can return an object contining the key `pgmemento.session_info` from a callback provided to the `pgSettings` option.
At this point, postgraphile will already have validated the JWT against the `jwtSecret` option, so you can trust the claims without additional validation. A basic usage could look like this (e.g. in your `.postgraphilerc.js`):

```js
module.exports = {
  options: {
    async pgSettings(req) {
      const claims = getClaimsFromRequest(req);
      return {
        "pgmemento.session_info": JSON.stringify({
          userId: claims.name,
        }),
      };
    },
    jwtSecret: "my-jwt-secret",
  },
};

function getClaimsFromRequest(req) {
  try {
    const { authorization } = req.headers;
    const [, token] = /^\s*bearer\s+(.*?)\s*$/i.exec(authorization);
    const [, claims] = token.split(".");
    return JSON.parse(Buffer.from(claims, "base64").toString());
  } catch {
    return {};
  }
}
```

# License

MIT. See [LICENSE](./LICENSE)
