type PgClass = import("graphile-build-pg").PgClass;
type DocumentNode = import("graphql").DocumentNode;

export function isAuditedClass(pgClass?: PgClass) {
  return (
    pgClass &&
    pgClass.namespaceName !== "pgmemento" &&
    pgClass.classKind === "r" &&
    pgClass.attributes.some(pgAttribute => pgAttribute.name === "audit_id")
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
