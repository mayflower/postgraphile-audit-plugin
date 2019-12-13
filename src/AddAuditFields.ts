import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
import { isAuditedClass, mergeTypeDefs } from "./util";
import { queryBuildersForTable } from "./queryBuilders";

type PgClass = import("graphile-build-pg").PgClass;
type Inflection = import("graphile-build").Inflection;

export const AddAuditFields = makeExtendSchemaPlugin(build => {
  const inflection: Inflection = build.inflection;
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
          ${inflection.pap_firstAuditEvent()}: AuditEvent! @pgQuery(
            source: ${embed(queryForAudits)}
            withQueryBuilder: ${embed(firstResult)}
          )
          ${inflection.pap_createdAt()}: String! @pgQuery(
            fragment: ${embed(queryForDate("first"))}
          )
          ${inflection.pap_lastAuditEvent()}: AuditEvent! @pgQuery(
            source: ${embed(queryForAudits)}
            withQueryBuilder: ${embed(lastResult)}
          )
          ${inflection.pap_lastModifiedAt()}: String! @pgQuery(
            fragment: ${embed(queryForDate("last"))}
          )
          ${inflection.pap_auditEvents()}: AuditEventsConnection! @pgQuery(
            source: ${embed(queryForAudits)}
          )
        }
      `;
  });

  return { typeDefs: mergeTypeDefs(typeDefs) };
});
