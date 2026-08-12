type CommandHandler = (args: unknown, ctx: unknown) => Promise<unknown>;

export interface PluginCommandRegistryInterface {
	register(pluginId: string, path: string, handler: CommandHandler): void;
	find(path: string): CommandHandler | undefined;
	remove(pluginId: string): void;
}

export class PluginCommandRegistry implements PluginCommandRegistryInterface {
	private _handlers = new Map<string, { pluginId: string; handler: CommandHandler }>();

	register(pluginId: string, path: string, handler: CommandHandler): void {
		const existing = this._handlers.get(path);
		if (existing) {
			throw new Error(
				`Command path "${path}" is already registered by plugin "${existing.pluginId}". Each command path must be unique.`,
			);
		}
		this._handlers.set(path, { pluginId, handler });
	}

	find(path: string): CommandHandler | undefined {
		return this._handlers.get(path)?.handler;
	}

	remove(pluginId: string): void {
		for (const [path, entry] of this._handlers) {
			if (entry.pluginId === pluginId) this._handlers.delete(path);
		}
	}
}
