// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { defaultCreateValues } from "@/components/agent-config-defaults";
import type { AdapterConfigFieldsProps } from "../types";
import { AntigravityLocalConfigFields } from "./config-fields";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function renderFields(overrides: Partial<AdapterConfigFieldsProps>) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const mark = vi.fn();
  const set = vi.fn();
  const props: AdapterConfigFieldsProps = {
    mode: "edit",
    isCreate: false,
    adapterType: "antigravity_local",
    values: null,
    set: null,
    config: {},
    eff: (_group, _field, original) => original,
    mark,
    models: [],
    ...overrides,
  };

  act(() => {
    root.render(
      <TooltipProvider>
        <AntigravityLocalConfigFields {...props} />
      </TooltipProvider>,
    );
  });
  return { container, root, mark, set };
}

describe("AntigravityLocalConfigFields", () => {
  const roots: Root[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) act(() => root.unmount());
    document.body.innerHTML = "";
  });

  it("defaults the create control off and persists an explicit opt-in", () => {
    const set = vi.fn();
    const result = renderFields({
      mode: "create",
      isCreate: true,
      values: {
        ...defaultCreateValues,
        adapterType: "antigravity_local",
        dangerouslySkipPermissions: false,
      },
      set,
    });
    roots.push(result.root);
    const toggle = result.container.querySelector<HTMLElement>(
      '[data-testid="antigravity-unattended-tools"]',
    );
    expect(toggle?.getAttribute("aria-checked")).toBe("false");
    expect(result.container.textContent).toContain("Allow unattended tool execution");
    expect(result.container.textContent).toContain(
      "Antigravity may execute requested tools without interactive approval",
    );

    act(() => toggle?.click());
    expect(set).toHaveBeenCalledWith({ dangerouslySkipPermissions: true });
  });

  it("loads and saves the existing edit value", () => {
    const result = renderFields({ config: { dangerouslySkipPermissions: true } });
    roots.push(result.root);
    const toggle = result.container.querySelector<HTMLElement>(
      '[data-testid="antigravity-unattended-tools"]',
    );
    expect(toggle?.getAttribute("aria-checked")).toBe("true");

    act(() => toggle?.click());
    expect(result.mark).toHaveBeenCalledWith(
      "adapterConfig",
      "dangerouslySkipPermissions",
      false,
    );
  });
});
