import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
import flatMap from "array.prototype.flatmap";
import { isAuditedClass, mergeTypeDefs } from "./util";
import { queryBuildersForTable } from "./queryBuilders";
import { getOptions } from "./options";

type PgClass = import("graphile-build-pg").PgClass;
type Inflection = import("graphile-build").Inflection;

export const AddAuditFields = makeExtendSchemaPlugin((build, options) => {
  const inflection: Inflection = build.inflection;
  const {
    auditEventConnection,
    firstLastAuditEvent,
    dateProps,
    nameProps,
  } = getOptions(build);
  const pgClasses: PgClass[] = build.pgIntrospectionResultsByKind.class;
  const auditedClasses = pgClasses.filter(isAuditedClass);

  const typeDefs = flatMap(auditedClasses, pgClass => {
    const {
      queryForAudits,
      firstResult,
      lastResult,
      queryForDate,
    } = queryBuildersForTable(pgClass, build);
    const typeDefs = [];
    if (firstLastAuditEvent) {
      typeDefs.push(gql`
      extend type ${inflection.tableType(pgClass)} {
        ${inflection.pap_firstAuditEvent()}: AuditEvent! @pgQuery(
          source: ${embed(queryForAudits)}
          withQueryBuilder: ${embed(firstResult)}
        )
        ${inflection.pap_lastAuditEvent()}: AuditEvent! @pgQuery(
            source: ${embed(queryForAudits)}
            withQueryBuilder: ${embed(lastResult)}
        )         
      }
      `);
    }
    if (dateProps) {
      typeDefs.push(gql`
      extend type ${inflection.tableType(pgClass)} {
        ${inflection.pap_createdAt()}: String! @pgQuery(
            fragment: ${embed(queryForDate("first"))}
        )
        ${inflection.pap_lastModifiedAt()}: String! @pgQuery(
            fragment: ${embed(queryForDate("last"))}
        )
      }
      `);
    }
    if (auditEventConnection) {
      typeDefs.push(gql`
      extend type ${inflection.tableType(pgClass)} {
        ${inflection.pap_auditEvents()}: AuditEventsConnection! @pgQuery(
            source: ${embed(queryForAudits)}
        )
      }
      `);
    }
    return typeDefs;
  });

  return { typeDefs: mergeTypeDefs(typeDefs) };
});
