import { AuditPluginOptions } from "./options";

type PgClass = import("graphile-build-pg").PgClass;
type PgSql2 = typeof import("pg-sql2");
type Build = import("graphile-build/node8plus/SchemaBuilder").Build;
type QueryBuilder = import("graphile-build-pg").QueryBuilder;

export function queryBuildersForTable(pgClass: PgClass, build: Build) {
  const sql: PgSql2 = build.pgSql;
  return {
    queryForAudits,
    queryForDate,
    queryForUser,
    firstResult,
    lastResult,
  };

  function queryForAudits(options: AuditPluginOptions) {
    return (queryBuilder: import("graphile-build-pg").QueryBuilder) => {
      return sql.fragment`
        ${sql.identifier(options.auditFunctionSchema)}.get_audit_information(
          ${queryBuilder.getTableAlias()}.${sql.identifier(
        options.auditIdColumnName
      )}, 
          ${sql.value(pgClass.namespaceName)}, 
          ${sql.value(pgClass.name)})`;
    };
  }

  function queryForDate(which: "first" | "last", options: AuditPluginOptions) {
    return (queryBuilder: QueryBuilder) =>
      sql.fragment`(SELECT stmt_date FROM ${queryForAudits(options)(
        queryBuilder
      )}  ORDER BY id ${sql.raw(which === "first" ? "ASC" : "DESC")} LIMIT 1)`;
  }
  function queryForUser(which: "first" | "last", options: AuditPluginOptions) {
    return (queryBuilder: QueryBuilder) =>
      sql.fragment`(SELECT COALESCE((${
        options.nameSource === "user_name"
          ? sql.identifier("user_name")
          : sql.fragment`${sql.identifier("session_info")}#>>${sql.value(
              options.nameSessionInfoJsonPath
            )}`
      }), ${sql.value(options.nameFallback)}) FROM ${queryForAudits(options)(
        queryBuilder
      )}  ORDER BY id ${sql.raw(which === "first" ? "ASC" : "DESC")} LIMIT 1)`;
  }

  function firstResult(queryBuilder: QueryBuilder) {
    queryBuilder.limit(1);
    queryBuilder.orderBy(sql.identifier("id"), true, false);
  }

  function lastResult(queryBuilder: QueryBuilder) {
    queryBuilder.limit(1);
    queryBuilder.orderBy(sql.identifier("id"), false, false);
  }
}
