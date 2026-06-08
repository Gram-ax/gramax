import type { EnterpriseCloudConfig } from "@app/config/AppConfig";
import type YamlFileConfig from "@core/utils/YamlFileConfig";

export class GesCloudManager {
	constructor(
		private readonly _defaultConfig: EnterpriseCloudConfig,
		private readonly _config?: YamlFileConfig<EnterpriseCloudConfig>,
	) {}

	getConfig(): EnterpriseCloudConfig {
		return {
			...this._defaultConfig,
			...(this._config?.inner?.() ?? {}),
		};
	}

	disable() {
		this._config?.set("enabled", false);
		return this._config?.save();
	}

	enable() {
		this._config?.set("enabled", true);
		return this._config?.save();
	}
}
