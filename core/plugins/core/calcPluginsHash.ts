import { XxHash } from "@core/Hash/Hasher";
import type { PluginReadResult } from "@plugins/core/PluginsAsset";

export function calcPluginsHash(plugins: PluginReadResult[]): number {
	return plugins.reduce((acc, plugin) => {
		const hasher = XxHash.hasher();
		hasher.hash(JSON.stringify(plugin.metadata));
		hasher.hash(plugin.script);
		hasher.hash(JSON.stringify([...(plugin.assets ?? [])].sort((a, b) => a.path.localeCompare(b.path))));
		return acc ^ hasher.finalize();
	}, 0);
}
