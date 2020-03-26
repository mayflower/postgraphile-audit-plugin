import {
  embed,
  gql,
  makeExtendSchemaPlugin,
  makePluginByCombiningPlugins,
} from "graphile-utils";

import { getOptions } from "./options";

type Plugin = import("graphile-build").Plugin;
type PgProc = import("graphile-build-pg").PgProc;
type PgType = import("graphile-build-pg").PgType;
type Build = import("graphile-build").Build;
type PgSql2 = typeof import("pg-sql2");
type QueryBuilder = import("graphile-build-pg").QueryBuilder;

function getAuditFunctionInfo(build: Build) {
  const procedures: PgProc[] = build.pgIntrospectionResultsByKind.procedure;
  const types: PgType[] = build.pgIntrospectionResultsByKind.type;
  const options = getOptions(build);
  const procedure = procedures.find(
    p =>
      p.namespaceName === options.auditFunctionSchema &&
      p.name === "get_audit_information"
  );
  const returnType = types.find(t => t.id === procedure?.returnTypeId);
  const returnTypeClass = returnType?.class;

  return {
    procedure,
    returnType,
    returnTypeClass,
  };
}

const OmitOriginalUserNameField: Plugin = builder => {
  builder.hook("build", build => {
    const { returnTypeClass } = getAuditFunctionInfo(build);

    if (returnTypeClass) {
      returnTypeClass.attributes.find(
        a => a.name === "user_name"
      )!.tags.omit = true;
    }

    return build;
  });
};

const AddCorrectedNameField = makeExtendSchemaPlugin(build => {
  const options = getOptions(build);
  const { returnTypeClass } = getAuditFunctionInfo(build);

  const returnTypeName: string = returnTypeClass
    ? build.inflection.tableType(returnTypeClass)
    : "AuditEvent";

  const sql: PgSql2 = build.pgSql;

  function nameFragment(queryBuilder: QueryBuilder) {
    return sql.fragment`COALESCE(${
      options.nameSource === "user_name"
        ? sql.fragment`${queryBuilder.getTableAlias()}.user_name`
        : sql.fragment`${queryBuilder.getTableAlias()}."session_info"#>>${sql.value(
            options.nameSessionInfoJsonPath
          )}`
    }, ${sql.value(options.nameFallback)})`;
  }

  return {
    typeDefs: gql`
  extend type ${returnTypeName} {
     ${build.inflection.pap_usernameField()}: String! @pgQuery(
      fragment: ${embed(nameFragment)})
  }
  `,
  };
});

export const UserNameField = makePluginByCombiningPlugins(
  OmitOriginalUserNameField,
  AddCorrectedNameField
);
