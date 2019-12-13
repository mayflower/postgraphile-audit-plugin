/**
 * @type {import("./src").AuditPluginOptions}
 */
const auditPlugin = {
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
