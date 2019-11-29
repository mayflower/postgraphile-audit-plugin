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
                postgraphile_audit_plugin.get_audit_information(${queryBuilder.getTableAlias()}.audit_id, 'postgraphile_audit_plugin', 'users')
            `;
              }
            )}
          )
        }
      `,
  };
});
