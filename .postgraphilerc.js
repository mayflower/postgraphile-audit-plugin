/**
 * @type {import("./src").AuditPluginOptions}
 */
const auditPlugin = {
  auditFunctionSchema: "postgraphile_audit_plugin",
  //auditEventConnection: false,
  //firstLastAuditEvent: false,
  //dateProps: false,
  //nameProps: false,
  nameSource: "session_info",
  nameSessionInfoJsonPath: "{nested,name}",
};

module.exports = {
  options: {
    graphileBuildOptions: {
      auditPlugin,
    },
  },
};
