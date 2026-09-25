import { configFieldsForSection } from "../config-sections";
import type { AdapterConfigFieldsProps } from "../types";
import { Field, ToggleField } from "../../components/agent-config-primitives";

export function AntigravityLocalConfigFields({
  section,
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  return configFieldsForSection(
    section,
    <>
      <Field label="Session behavior" hint="Uses an explicit Antigravity conversation ID for safe continuation.">
        <p className="text-sm text-muted-foreground">One agy process is started per run.</p>
      </Field>
      <div className="space-y-1.5">
        <ToggleField
          label="Allow unattended tool execution"
          checked={
            isCreate
              ? values?.dangerouslySkipPermissions === true
              : eff(
                  "adapterConfig",
                  "dangerouslySkipPermissions",
                  config.dangerouslySkipPermissions === true,
                ) === true
          }
          onChange={(enabled) =>
            isCreate
              ? set?.({ dangerouslySkipPermissions: enabled })
              : mark("adapterConfig", "dangerouslySkipPermissions", enabled)
          }
          toggleTestId="antigravity-unattended-tools"
        />
        <p className="text-xs text-muted-foreground">
          Warning: when enabled, Antigravity may execute requested tools without interactive approval.
        </p>
      </div>
    </>,
  );
}
