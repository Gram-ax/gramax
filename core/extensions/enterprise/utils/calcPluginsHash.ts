import { XxHash } from "@core/Hash/Hasher";
import { PluginReadResult } from "@ext/workspace/assets";

export function calcPluginsHash(plugins: PluginReadResult[]): number {
	return plugins.reduce((acc, plugin) => {
		const hasher = XxHash.hasher();
		hasher.hash(JSON.stringify(plugin.metadata));
		hasher.hash(plugin.script);
		return acc ^ hasher.finalize();
	}, 0);
}
