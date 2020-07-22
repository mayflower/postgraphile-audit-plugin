import { orderByAscDesc } from "graphile-utils";
import { isAuditedClass } from "./util";
import { queryBuildersForTable } from "./queryBuilders";
import { getOptions } from "./options";
type Plugin = import("graphile-build").Plugin;
type SQL = import("pg-sql2").SQL;
type QueryBuilder = import("graphile-build-pg").QueryBuilder;
type Inflection = import("graphile-build").Inflection;

function wrapForOrderByAscDesc(fn: (queryBuilder: QueryBuilder) => SQL) {
  return (({ queryBuilder }: { queryBuilder: QueryBuilder }) =>
    fn(queryBuilder)) as any;
}

export const OrderByAudit: Plugin = builder => {
  builder.hook("GraphQLEnumType:values", (values, build, context) => {
    const {
      scope: { isPgRowSortEnum, pgIntrospection: pgClass },
    } = context;

    const auditOptions = getOptions(build);

    if (!isPgRowSortEnum || !isAuditedClass(pgClass, auditOptions)) {
      return values;
    }

    const inflection: Inflection = build.inflection;
    const { dateProps, nameProps } = auditOptions;
    const { queryForDate, queryForUser } = queryBuildersForTable(
      pgClass,
      build
    );

    const extraOrderOptions = Object.assign(
      {},
      dateProps &&
        orderByAscDesc(
          inflection.constantCase(inflection.pap_createdAt()),
          wrapForOrderByAscDesc(queryForDate("first", auditOptions))
        ),
      dateProps &&
        orderByAscDesc(
          inflection.constantCase(inflection.pap_lastModifiedAt()),
          wrapForOrderByAscDesc(queryForDate("last", auditOptions))
        ),

      nameProps &&
        orderByAscDesc(
          inflection.constantCase(inflection.pap_createdBy()),
          wrapForOrderByAscDesc(queryForUser("first", auditOptions))
        ),
      nameProps &&
        orderByAscDesc(
          inflection.constantCase(inflection.pap_lastModifiedBy()),
          wrapForOrderByAscDesc(queryForUser("last", auditOptions))
        )
    );

    return build.extend(
      values,
      extraOrderOptions,
      "AuditPlugin - add sort enum"
    );
  });
};
