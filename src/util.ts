type PgClass = import("graphile-build-pg").PgClass;

export function isAuditedClass(pgClass?: PgClass) {
  return (
    pgClass &&
    pgClass.namespaceName !== "pgmemento" &&
    pgClass.classKind === "r" &&
    pgClass.attributes.some(pgAttribute => pgAttribute.name === "audit_id")
  );
}
