type PgClass = import("graphile-build-pg").PgClass;
type PgSql2 = typeof import("pg-sql2");
type Build = import("graphile-build/node8plus/SchemaBuilder").Build;
type QueryBuilder = import("graphile-build-pg").QueryBuilder;

function queryBuildersForTable(pgClass: PgClass, build: Build) {
  const sql: PgSql2 = build.pgSql;
  return {
    queryForAudits,
    queryForDate,
    firstResult,
    lastResult,
  };

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
