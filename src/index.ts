import { makePluginByCombiningPlugins } from "graphile-utils";
import { AddAuditFields } from "./AddAuditFields";
import { AddAuditedInterface } from "./AddAuditInterface";

export default makePluginByCombiningPlugins(
  AddAuditFields,
  AddAuditedInterface
);
