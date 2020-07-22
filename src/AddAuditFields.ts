import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils";
import flatMap from "array.prototype.flatmap";
import { isAuditedClass, mergeTypeDefs } from "./util";
import { queryBuildersForTable } from "./queryBuilders";
import { getOptions } from "./options";

type PgClass = import("graphile-build-pg").PgClass;
type Inflection = import("graphile-build").Inflection;

export const AddAuditFields = makeExtendSchemaPlugin((build, options) => {
  const inflection: Inflection = build.inflection;
  const auditOptions = getOptions(build);
  const {
    auditEventConnection,
    firstLastAuditEvent,
    dateProps,
    nameProps,
  } = auditOptions;

  const pgClasses: PgClass[] = build.pgIntrospectionResultsByKind.class;
  const auditedClasses = pgClasses.filter(pgEntity =>
    isAuditedClass(pgEntity, auditOptions)
  );

  const typeDefs = flatMap(auditedClasses, pgClass => {
    const {
      queryForAudits,
      firstResult,
      lastResult,
      queryForDate,
      queryForUser,
    } = queryBuildersForTable(pgClass, build);
    const typeDefs = [];
    if (firstLastAuditEvent) {
      typeDefs.push(gql`
      extend type ${inflection.tableType(pgClass)} {
        ${inflection.pap_firstAuditEvent()}: AuditEvent! @pgQuery(
          source: ${embed(queryForAudits(auditOptions))}
          withQueryBuilder: ${embed(firstResult)}
        )
        ${inflection.pap_lastAuditEvent()}: AuditEvent! @pgQuery(
            source: ${embed(queryForAudits(auditOptions))}
            withQueryBuilder: ${embed(lastResult)}
        )         
      }
      `);
    }
    if (dateProps) {
      typeDefs.push(gql`
      extend type ${inflection.tableType(pgClass)} {
        ${inflection.pap_createdAt()}: String! @pgQuery(
            fragment: ${embed(queryForDate("first", auditOptions))}
        )
        ${inflection.pap_lastModifiedAt()}: String! @pgQuery(
            fragment: ${embed(queryForDate("last", auditOptions))}
        )
      }
      `);
    }
    if (nameProps) {
      typeDefs.push(gql`
      extend type ${inflection.tableType(pgClass)} {
        ${inflection.pap_createdBy()}: String! @pgQuery(
            fragment: ${embed(queryForUser("first", auditOptions))}
        )
        ${inflection.pap_lastModifiedBy()}: String! @pgQuery(
            fragment: ${embed(queryForUser("last", auditOptions))}
        )
      }
      `);
    }
    if (auditEventConnection) {
      typeDefs.push(gql`
      extend type ${inflection.tableType(pgClass)} {
        ${inflection.pap_auditEvents()}: AuditEventsConnection! @pgQuery(
            source: ${embed(queryForAudits(auditOptions))}
        )
      }
      `);
    }
    return typeDefs;
  });
  if (typeDefs.length === 0) {
    console.error("no entities found to add audit fields to");
  }
  return { typeDefs: mergeTypeDefs(typeDefs) };
});
