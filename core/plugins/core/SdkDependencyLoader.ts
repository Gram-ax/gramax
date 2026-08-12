import { PlatformServiceNew } from "@core-ui/PlatformService";
import type UiLanguage from "@ext/localization/core/model/Language";
import tRaw, { getCurrentLanguage, type TranslationKey } from "@ext/localization/locale/translate";
import { initializeSdk, pluginCommandExecutor } from "@plugins/api/sdk";
import type { SdkDependencies } from "@plugins/api/sdk/core";
import { type PluginContainer, ServiceKey } from "@plugins/core/PluginContainer";
import { PluginCommandRegistry } from "@plugins/registry";

export class SdkDependencyLoader {
	private _initialized = false;

	constructor(
		private _container: PluginContainer,
		private _app?: unknown,
	) {}

	async load(): Promise<void> {
		if (this._initialized) return;

		const [t, Modal, isPlatform] = await Promise.all([
			this._loadTranslation(),
			this._loadModal(),
			this._loadPlatformService(),
		]);

		const deps: SdkDependencies = {
			extensions: this._container.get(ServiceKey.Extensions),
			menus: this._container.get(ServiceKey.Menus),
			events: this._container.get(ServiceKey.Events),
			commands: pluginCommandExecutor,
			pluginCommands: new PluginCommandRegistry(),
			app: this._app,
			t,
			Modal,
			isPlatform,
		};
		initializeSdk(deps);

		this._initialized = true;
	}

	private async _loadTranslation() {
		const locales = this._container.get(ServiceKey.Locales);

		return (key: TranslationKey, forceLanguage?: UiLanguage) => {
			const language = forceLanguage ?? getCurrentLanguage();
			const pluginTranslation = locales.getTranslation(language, key);
			return pluginTranslation ?? tRaw(key, forceLanguage);
		};
	}

	private async _loadModal() {
		const { Modal } = await import("@plugins/api/ui/Modal");
		return Modal;
	}

	private async _loadPlatformService() {
		return PlatformServiceNew.isPlatform.bind(PlatformServiceNew);
	}
}
