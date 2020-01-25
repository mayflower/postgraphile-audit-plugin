type Build = import("graphile-build").Build;
type Options = import("graphile-build").Options;

export interface AuditPluginOptions {
  /**
   * name of the schema that contains the `get_audit_information` function
   */
  auditFunctionSchema: string;

  /**
   * include "auditEvents" connection on audited types
   */
  auditEventConnection: boolean;
  /**
   * include "firstAuditEvent" and "lastAuditEvent" field on audited types
   */
  firstLastAuditEvent: boolean;
  /**
   * include "createdAt" and "lastModifiedAt" field on audited types
   */
  dateProps: boolean;
  /**
   * include "createdBy" and "lastModifiedBy" on audited types
   */
  nameProps: boolean;
  /**
   * define how "name" properties should be filled - either with the transaction's "user_name", or with a value from the "session_info" JSON
   */
  nameSource: "user_name" | "session_info";

  /**
   * if `nameSource` is "session_info", this describes the path to the username within the JSON
   * e.g. "{name}" or "{nested,user,name}" (see the #>> notation described in https://www.postgresql.org/docs/9.3/functions-json.html)
   */
  nameSessionInfoJsonPath: string;

  /**
   * if name cannot be filled (because it is null or undefined), fall back to this value
   */
  nameFallback: string;
}
export function getOptions(build: Build): AuditPluginOptions {
  const options: Options = build.options;
  const {
    auditPlugin: {
      auditFunctionSchema = "public",
      auditEventConnection = true,
      firstLastAuditEvent = true,
      dateProps = true,
      nameProps = true,
      nameSource = "user_name",
      nameSessionInfoJsonPath = "{name}",
      nameFallback = "unknown user",
    } = {},
  } = options;
  return {
    auditFunctionSchema,
    auditEventConnection,
    firstLastAuditEvent,
    dateProps,
    nameProps,
    nameSource,
    nameSessionInfoJsonPath,
    nameFallback,
  };
}
