import UiLanguage from "@ext/localization/core/model/Language";
import { getCurrentLanguage, TranslationKey } from "@ext/localization/locale/translate";
import { initializeSdk } from "@plugins/api/sdk";
import { SdkDependencies } from "@plugins/api/sdk/core";
import { PluginContainer, ServiceKey } from "@plugins/core/PluginContainer";

export class SdkDependencyLoader {
	private initialized = false;

	constructor(private _container: PluginContainer) {}

	async load(): Promise<void> {
		if (this.initialized) return;

		const [t, Modal, isPlatform] = await Promise.all([
			this._loadTranslation(),
			this._loadModal(),
			this._loadPlatformService(),
		]);

		const deps: SdkDependencies = {
			extensions: this._container.get(ServiceKey.Extensions),
			menus: this._container.get(ServiceKey.Menus),
			events: this._container.get(ServiceKey.Events),
			t,
			Modal,
			isPlatform,
		};
		initializeSdk(deps);

		this.initialized = true;
	}

	private async _loadTranslation() {
		const { default: tRaw } = await import("@ext/localization/locale/translate");
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
		const { PlatformServiceNew } = await import("@core-ui/PlatformService");
		return PlatformServiceNew.isPlatform.bind(PlatformServiceNew);
	}
}
