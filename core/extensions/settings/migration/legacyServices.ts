/**
 * Maps the legacy, scattered service fields (camelCase `gitProxy.url` etc. plus
 * the top-level `webEditorUrl`) onto the canonical `services.<key>` names.
 *
 * Used by the eager workspace.yaml migration to fold legacy overrides into
 * `settings.services`. Returns bare URL strings; callers wrap them in `{ endpoint }`.
 */
export type LegacyServiceSource = {
	services?: {
		gitProxy?: { url?: string };
		auth?: { url?: string };
		diagramRenderer?: { url?: string };
	};
	webEditorUrl?: string;
};

const LEGACY_SERVICE_MAP: { key: string; read: (source: LegacyServiceSource) => string | undefined }[] = [
	{ key: "git-proxy", read: (s) => s.services?.gitProxy?.url },
	{ key: "auth", read: (s) => s.services?.auth?.url },
	{ key: "diagram-renderer", read: (s) => s.services?.diagramRenderer?.url },
	{ key: "web-editor", read: (s) => s.webEditorUrl },
];

export const mapLegacyServices = (source: LegacyServiceSource): Record<string, string> => {
	const mapped: Record<string, string> = {};
	for (const { key, read } of LEGACY_SERVICE_MAP) {
		const url = read(source);
		if (url) mapped[key] = url;
	}
	return mapped;
};
