import { configFieldsForSection } from "../config-sections";
import type { AdapterConfigFieldsProps } from "../types";
import { Field } from "../../components/agent-config-primitives";
export function AntigravityLocalConfigFields({ section }: AdapterConfigFieldsProps) {
  return configFieldsForSection(section, <Field label="Session behavior" hint="Uses an explicit Antigravity conversation ID for safe continuation."><p className="text-sm text-muted-foreground">One agy process is started per run. Permission bypass remains disabled unless explicitly configured.</p></Field>);
}
