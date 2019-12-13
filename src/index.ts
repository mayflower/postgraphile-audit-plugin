import { makePluginByCombiningPlugins } from "graphile-utils";
import { AddAuditFields } from "./AddAuditFields";
import { AddAuditedInterface } from "./AddAuditInterface";

import { AdditionalInflectors, inflectors } from "./inflectors";
import { AuditPluginOptions } from "./options";

declare module "graphile-build" {
  interface Inflection extends AdditionalInflectors {}
  interface Options {
    auditPlugin?: Partial<AuditPluginOptions>;
  }
}

export default makePluginByCombiningPlugins(
  inflectors,
  AddAuditFields,
  AddAuditedInterface
);
