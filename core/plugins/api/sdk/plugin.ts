import { span } from "@ext/loggers/opentelemetry";
import type { PluginProps, Plugin as PluginSdk } from "@gramax/sdk";
import type { Extension as ExtensionSDK } from "@gramax/sdk/editor";
import type { PluginEventMap, PluginEventName } from "@gramax/sdk/events";
import type { MenuModifier } from "@gramax/sdk/ui";
import { getDeps, type HttpCommandExecutor } from "./core";

interface PluginCommandsApi extends HttpCommandExecutor {
	register(path: string, handler: (args: unknown, ctx: unknown) => Promise<unknown>): void;
}

interface PluginEventsApi {
	on<E extends PluginEventName>(event: E, handler: PluginEventMap[E]): void;
}

interface PluginUiApi {
	menus: { registerModifier(modifier: MenuModifier): void };
}

interface PluginContext {
	commands: PluginCommandsApi;
	events: PluginEventsApi;
	ui: PluginUiApi;
}

export abstract class Plugin implements PluginSdk {
	pluginId: string = "";
	private _ctx?: PluginContext;

	// biome-ignore lint/complexity/noUselessConstructor: matches @gramax/sdk Plugin interface signature
	constructor(_options?: PluginProps) {}

	abstract onload(): void | Promise<void>;
	onunload(): void {}

	get ctx(): PluginContext {
		if (!this.pluginId) {
			throw new Error(
				`Plugin.ctx accessed before initialization. Use ctx only inside onload(), not in the constructor.`,
			);
		}

		if (!this._ctx) {
			this._ctx = {
				commands: {
					execute: <TResult = unknown>(path: string, args?: unknown): Promise<TResult> => {
						const localHandler = getDeps().pluginCommands.find(path);
						if (localHandler) {
							const ctx = { commands: getDeps().commands, app: getDeps().app };
							return localHandler(args, ctx) as Promise<TResult>;
						}
						return getDeps().commands.execute<TResult>(path, args);
					},
					register: (path, handler) => getDeps().pluginCommands.register(this.pluginId, path, handler),
				},
				events: {
					on: (event, handler) => this.addEvent(event, handler),
				},
				ui: {
					menus: {
						registerModifier: (modifier) => this.registerMenuModifier(modifier),
					},
				},
			};
		}

		return this._ctx;
	}

	// biome-ignore lint/style/useNamingConvention: runtime loader expects this method name
	_setContainer(pluginId: string): void {
		this.pluginId = pluginId;
	}

	// biome-ignore lint/style/useNamingConvention: runtime loader calls this instead of onunload() directly
	_unload(): void {
		try {
			this.onunload();
		} catch (error) {
			span()?.recordException(error as Error);
		}

		this._ctx = undefined;
	}

	/** @deprecated Use this.ctx.* instead */
	registerExtension(extension: ExtensionSDK): void {
		getDeps().extensions.registerExtension(this.pluginId, extension);
	}

	/** @deprecated Use this.ctx.ui.menus.registerModifier() instead */
	registerMenuModifier(modifier: MenuModifier): void {
		getDeps().menus.registerModifier(this.pluginId, modifier);
	}

	/** @deprecated Use this.ctx.events.on() instead */
	addEvent<E extends PluginEventName>(event: E, handler: PluginEventMap[E]): void {
		getDeps().events.registerEvent(this.pluginId, event, handler);
	}
}
