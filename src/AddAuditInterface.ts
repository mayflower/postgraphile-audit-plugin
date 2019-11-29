import { isAuditedClass } from "./util";

type Plugin = import("graphile-build").Plugin;

export const AddAuditedInterface: Plugin = builder => {
  builder.hook(
    "init",
    function defineAuditInterfaceType(_, build) {
      const {
        getTypeByName,
        newWithHooks,
        graphql: { GraphQLNonNull, GraphQLInterfaceType },
      } = build;

      newWithHooks(
        GraphQLInterfaceType,
        {
          name: "Audited",
          description: "An interface for all Audited types.",
          fields: () => ({
            firstAuditEvent: {
              type: new GraphQLNonNull(getTypeByName("AuditEvent")),
            },
            createdAt: { type: new GraphQLNonNull(getTypeByName("String")) },
            lastAuditEvent: {
              type: new GraphQLNonNull(getTypeByName("AuditEvent")),
            },
            lastModifiedAt: {
              type: new GraphQLNonNull(getTypeByName("String")),
            },
            auditEvents: {
              name: "auditEvents",
              type: new GraphQLNonNull(getTypeByName("AuditEventsConnection")),
              args: {
                first: { type: getTypeByName("Int") },
                last: { type: getTypeByName("Int") },
                offset: { type: getTypeByName("Int") },
                before: { type: getTypeByName("Cursor") },
                after: { type: getTypeByName("Cursor") },
              },
            },
          }),
        },
        {
          __origin: `Audit`,
        }
      );
      return _;
    },
    ["Audit"]
  );

  builder.hook(
    "GraphQLObjectType:interfaces",
    function addInterfaceToAuditedTypes(interfaces, build, context) {
      if (
        !context.scope.isPgRowType ||
        !isAuditedClass(build.scopeByType.get(context.Self)?.pgIntrospection)
      ) {
        return interfaces;
      }

      const Audited = build.getTypeByName("Audited");

      if (Audited) {
        return [...interfaces, Audited];
      } else {
        return interfaces;
      }
    },
    ["Audit"]
  );
};
