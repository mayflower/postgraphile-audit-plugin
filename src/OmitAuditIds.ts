import { Plugin } from "graphile-build";
import { PgAttribute } from "graphile-build-pg";
import { isAuditedClass } from "./util";
import { getOptions } from "./options";

export const OmitAuditIds: Plugin = builder => {
  builder.hook(
    "build",
    build => {
      const attributes: PgAttribute[] =
        build.pgIntrospectionResultsByKind.attribute;

      const auditOptions = getOptions(build);
      const { auditIdColumnName } = auditOptions;

      for (const attr of attributes) {
        if (
          attr.name === auditIdColumnName &&
          isAuditedClass(attr.class, auditOptions)
        ) {
          attr.tags.omit = true;
        }
      }
      return build;
    },
    ["OmitAuditIds"],
    [],
    []
  );
};
