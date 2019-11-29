import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
import { QueryBuilder } from "graphile-build-pg";

interface AuditEventArgs {
  first: number;
  last: number;
  offset: number;
  before: string;
  after: string;
}

export default makeExtendSchemaPlugin(build => {
  const sql: typeof import("pg-sql2") = build.pgSql;

  return {
    typeDefs: gql`
        extend type User {
          audit: AuditEventsConnection @pgQuery(
            source: ${embed(
              (queryBuilder: QueryBuilder, args: AuditEventArgs) => {

                return sql.fragment`
(WITH single_row_logs as (
	SELECT * FROM (
		(SELECT 1 AS event_id, ${queryBuilder.getTableAlias()}.audit_id)
		UNION ALL
		(select event_id, audit_id from row_log where audit_id = ${queryBuilder.getTableAlias()}.audit_id)
	) t
	WHERE event_id >= ${sql.value(args.after || 0)}
	LIMIT ${sql.value(args.first)} + 1
),
boundaries AS (
	SELECT DISTINCT MIN(event_id) "from", MAX(event_id) "to" FROM single_row_logs
)
 SELECT
 log->'audit_id' AS audit_id,

 log->'event_id' AS event_id,
  log->'transaction_id' AS transaction_id,
  log - 'audit_id' - 'event_id' - 'transaction_id'
FROM
	boundaries,
  pgmemento.restore_records(boundaries."from", boundaries."to"+1, 'users', 'postgraphile_audit_plugin', 1, true)
   AS (log JSONB))
            `;
              }
            )}
          )
        }
      `,
  };
});
