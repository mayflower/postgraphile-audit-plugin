import { Plugin } from "graphile-build";
import { PgAttribute } from "graphile-build-pg";
import { isAuditedClass } from "./util";

export const OmitAuditIds: Plugin = builder => {
  builder.hook(
    "build",
    build => {
      const attributes: PgAttribute[] =
        build.pgIntrospectionResultsByKind.attribute;

      for (const attr of attributes) {
        if (attr.name === "audit_id" && isAuditedClass(attr.class)) {
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
