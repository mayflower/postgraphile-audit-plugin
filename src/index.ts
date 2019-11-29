import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
type DocumentNode = import("graphql").DocumentNode;

export default makeExtendSchemaPlugin(build => {
  const sql: typeof import("pg-sql2") = build.pgSql;
  const inflection = build.inflection;
  const pgClasses: import("graphile-build-pg").PgClass[] =
    build.pgIntrospectionResultsByKind.class;
  const auditedClasses = pgClasses.filter(
    pgClass =>
      pgClass.namespaceName !== "pgmemento" &&
      pgClass.classKind === "r" &&
      pgClass.attributes.some(pgAttribute => pgAttribute.name === "audit_id")
  );

  const typeDefs = auditedClasses.reduce<DocumentNode>(
    (acc: null | DocumentNode, pgClass): DocumentNode => {
      let typeDef = gql`
      extend type ${inflection.tableType(pgClass)} {
        audit: AuditEventsConnection @pgQuery(
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
        (acc.definitions as any) = [...acc.definitions, ...typeDef.definitions];
        return acc;
      }
    },
    (null as unknown) as DocumentNode
  );

  return {
    typeDefs,
  };
});
