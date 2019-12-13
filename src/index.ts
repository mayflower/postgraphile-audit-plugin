import { makePluginByCombiningPlugins } from "graphile-utils";
import { AddAuditFields } from "./AddAuditFields";
import { AddAuditedInterface } from "./AddAuditInterface";

import { AdditionalInflectors, inflectors } from "./inflectors";
declare module "graphile-build" {
  interface Inflection extends AdditionalInflectors {}
}

export default makePluginByCombiningPlugins(
  inflectors,
  AddAuditFields,
  AddAuditedInterface
);
