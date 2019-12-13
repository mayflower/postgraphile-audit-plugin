import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
import { isAuditedClass, mergeTypeDefs } from "./util";

type PgClass = import("graphile-build-pg").PgClass;

export const AddAuditFields = makeExtendSchemaPlugin(build => {
  const inflection = build.inflection;
  const pgClasses: PgClass[] = build.pgIntrospectionResultsByKind.class;
  const auditedClasses = pgClasses.filter(isAuditedClass);

  const typeDefs = auditedClasses.map(pgClass => {
    const {
      queryForAudits,
      firstResult,
      lastResult,
      queryForDate,
    } = queryBuildersForTable(pgClass, build);
    return gql`
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
  });

  return { typeDefs: mergeTypeDefs(typeDefs) };
});
