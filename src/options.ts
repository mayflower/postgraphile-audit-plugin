type Build = import("graphile-build").Build;
type Options = import("graphile-build").Options;

export interface AuditPluginOptions {
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
}
export function getOptions(build: Build): AuditPluginOptions {
  const options: Options = build.options;
  const {
    auditPlugin: {
      auditEventConnection = true,
      firstLastAuditEvent = true,
      dateProps = true,
      nameProps = true,
    } = {},
  } = options;
  return {
    auditEventConnection,
    firstLastAuditEvent,
    dateProps,
    nameProps,
  };
}
