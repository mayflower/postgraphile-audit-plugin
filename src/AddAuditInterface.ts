import { isAuditedClass } from "./util";
import { getOptions } from "./options";

type Plugin = import("graphile-build").Plugin;
type Inflection = import("graphile-build").Inflection;
type GraphQLType = import("graphql").GraphQLType;

export const AddAuditedInterface: Plugin = builder => {
  builder.hook(
    "init",
    function defineAuditInterfaceType(_, build) {
      const {
        getTypeByName,
        newWithHooks,
        graphql: { GraphQLNonNull, GraphQLInterfaceType },
      } = build;
      const {
        auditEventConnection,
        firstLastAuditEvent,
        dateProps,
        nameProps,
        auditEventFieldsAndConnectionOptional,
      } = getOptions(build);
      const inflection: Inflection = build.inflection;

      const fieldTypeWrapper = (fieldType: any) => {
        return auditEventFieldsAndConnectionOptional
          ? fieldType
          : new GraphQLNonNull(fieldType);
      };

      newWithHooks(
        GraphQLInterfaceType,
        {
          name: inflection.pap_AuditedInterface(),
          description: "An interface for all Audited types.",
          fields: () => {
            const fields: {
              [fieldName: string]: {
                type: GraphQLType;
                args?: any;
              };
            } = {};

            if (firstLastAuditEvent) {
              fields[inflection.pap_firstAuditEvent()] = {
                type: fieldTypeWrapper(getTypeByName("AuditEvent")),
              };
              fields[inflection.pap_lastAuditEvent()] = {
                type: fieldTypeWrapper(getTypeByName("AuditEvent")),
              };
            }

            if (dateProps) {
              fields[inflection.pap_createdAt()] = {
                type: fieldTypeWrapper(getTypeByName("String")),
              };
              fields[inflection.pap_lastModifiedAt()] = {
                type: fieldTypeWrapper(getTypeByName("String")),
              };
            }

            if (nameProps) {
              fields[inflection.pap_createdBy()] = {
                type: fieldTypeWrapper(getTypeByName("String")),
              };
              fields[inflection.pap_lastModifiedBy()] = {
                type: fieldTypeWrapper(getTypeByName("String")),
              };
            }

            if (auditEventConnection) {
              fields[inflection.pap_auditEvents()] = {
                type: fieldTypeWrapper(getTypeByName("AuditEventsConnection")),
                args: {
                  first: { type: getTypeByName("Int") },
                  last: { type: getTypeByName("Int") },
                  offset: { type: getTypeByName("Int") },
                  before: { type: getTypeByName("Cursor") },
                  after: { type: getTypeByName("Cursor") },
                },
              };
            }
            return fields;
          },
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
        !isAuditedClass(
          build.scopeByType.get(context.Self)?.pgIntrospection,
          getOptions(build)
        )
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
