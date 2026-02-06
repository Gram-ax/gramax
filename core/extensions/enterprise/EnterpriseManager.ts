import { EnterpriseConfig } from "@app/config/AppConfig";
import YamlFileConfig from "@core/utils/YamlFileConfig";

class EnterpriseManager {
	constructor(
		private _defaultConfig: EnterpriseConfig,
		private _config?: YamlFileConfig<EnterpriseConfig>,
	) {}

	getConfig() {
		return { ...this._defaultConfig, ...(this._config?.inner?.() ?? {}) };
	}

	async setGesUrl(gesUrl: string) {
		this._config?.set("gesUrl", gesUrl);
		await this._config?.save();
	}
}

export default EnterpriseManager;
