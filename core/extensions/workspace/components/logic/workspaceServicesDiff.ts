import { SERVICE_SETTING_KEYS } from "@ext/settings/logic/formSchema";

type ServiceValue = { endpoint?: string } | undefined;

/**
 * Emits a dotted-path patch (`services.<key>.endpoint`) for every service whose
 * endpoint changed. Iterates the canonical key list so adding a service is a
 * one-line change in `SERVICE_SETTING_KEYS`, not here.
 */
export const getWorkspaceServicesDiff = (
	origServices: Record<string, ServiceValue>,
	newServices: Record<string, ServiceValue>,
): Record<string, unknown> => {
	const patch: Record<string, unknown> = {};
	for (const key of SERVICE_SETTING_KEYS) {
		const next = newServices[key]?.endpoint ?? "";
		const prev = origServices[key]?.endpoint ?? "";
		if (next !== prev) patch[`services.${key}.endpoint`] = next;
	}
	return patch;
};
