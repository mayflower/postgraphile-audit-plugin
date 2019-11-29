import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
import { isAuditedClass } from "./util";

type Plugin = import("graphile-build").Plugin;
type PgClass = import("graphile-build-pg").PgClass;
type DocumentNode = import("graphql").DocumentNode;

export const AddAuditFields = makeExtendSchemaPlugin(build => {
  const sql: typeof import("pg-sql2") = build.pgSql;
  const inflection = build.inflection;
  const pgClasses: PgClass[] = build.pgIntrospectionResultsByKind.class;
  const auditedClasses = pgClasses.filter(isAuditedClass);

  const typeDefs = auditedClasses.reduce<DocumentNode>(
    (acc: null | DocumentNode, pgClass): DocumentNode => {
      let typeDef = gql`
        extend type ${inflection.tableType(pgClass)} {
          auditEvents: AuditEventsConnection! @pgQuery(
            source: ${embed(
              (
                queryBuilder: import("graphile-build-pg").QueryBuilder
              ) => sql.fragment`
                postgraphile_audit_plugin.get_audit_information(
                  ${queryBuilder.getTableAlias()}.audit_id, 
                  ${sql.value(pgClass.namespaceName)}, 
                  ${sql.value(pgClass.name)})`
            )}
          )
        }
      `;
      if (acc === null) {
        return typeDef;
      } else {
        return Object.assign(acc, {
          definitions: [...acc.definitions, ...typeDef.definitions],
        });
      }
    },
    (null as unknown) as DocumentNode
  );

  return {
    typeDefs,
  };
});
