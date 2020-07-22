import { AuditPluginOptions } from ".";

type PgEntity = import("graphile-build-pg").PgEntity;
type PgClass = import("graphile-build-pg").PgClass;
type DocumentNode = import("graphql").DocumentNode;

export function isAuditedClass(
  pgEntity: PgEntity | undefined,
  options: AuditPluginOptions
): pgEntity is PgClass {
  return (
    !!pgEntity &&
    pgEntity.kind === "class" &&
    pgEntity.namespaceName !== "pgmemento" &&
    !!pgEntity.namespace &&
    pgEntity.classKind === "r" &&
    pgEntity.attributes.some(
      pgAttribute => pgAttribute.name === options.auditIdColumnName
    )
  );
}

/**
 * Merges all typeDefs into the first typeDef of the typeDefs array.
 * Returns that first value.
 * @param typeDefs
 */
export function mergeTypeDefs([
  firstTypeDef,
  ...otherTypeDefs
]: DocumentNode[]): DocumentNode {
  return otherTypeDefs.reduce((acc, typeDef): DocumentNode => {
    return Object.assign(acc, {
      definitions: [...acc.definitions, ...typeDef.definitions],
    });
  }, firstTypeDef);
}
