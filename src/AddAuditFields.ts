import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
import { isAuditedClass } from "./util";
import { QueryBuilder } from "graphile-build-pg";

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
          firstAuditEvent: AuditEvent! @pgQuery(
            source: ${embed(queryForAudits)}
            withQueryBuilder: ${embed(firstResult)}
          )
          createdAt: String! @pgQuery(
            fragment: ${embed(queryForDate("first"))}
          )
          lastAuditEvent: AuditEvent! @pgQuery(
            source: ${embed(queryForAudits)}
            withQueryBuilder: ${embed(lastResult)}
          )
          lastModifiedAt: String! @pgQuery(
            fragment: ${embed(queryForDate("last"))}
          )
          auditEvents: AuditEventsConnection! @pgQuery(
            source: ${embed(queryForAudits)}
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

      function queryForAudits(
        queryBuilder: import("graphile-build-pg").QueryBuilder
      ) {
        return sql.fragment`
        postgraphile_audit_plugin.get_audit_information(
          ${queryBuilder.getTableAlias()}.audit_id, 
          ${sql.value(pgClass.namespaceName)}, 
          ${sql.value(pgClass.name)})`;
      }

      function queryForDate(which: "first" | "last") {
        return (queryBuilder: QueryBuilder) =>
          sql.fragment`(SELECT stmt_date FROM ${queryForAudits(
            queryBuilder
          )}  ORDER BY id ${sql.raw(
            which === "first" ? "ASC" : "DESC"
          )} LIMIT 1)`;
      }

      function firstResult(queryBuilder: QueryBuilder) {
        queryBuilder.limit(1);
        queryBuilder.orderBy(sql.identifier("id"), true, false);
      }

      function lastResult(queryBuilder: QueryBuilder) {
        queryBuilder.limit(1);
        queryBuilder.orderBy(sql.identifier("id"), false, false);
      }
    },
    (null as unknown) as DocumentNode
  );

  return {
    typeDefs,
  };
});
