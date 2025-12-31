export abstract class PluginRegistry<TKey, TValue> {
	protected data = new Map<TKey, TValue>();

	clear(): void {
		this.data.clear();
	}

	protected getData(): Map<TKey, TValue> {
		return this.data;
	}
	abstract remove(pluginId: string): void;
}
