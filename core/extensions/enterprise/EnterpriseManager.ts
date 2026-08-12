import type { EnterpriseConfig } from "@app/config/AppConfig";
import type YamlFileConfig from "@core/utils/YamlFileConfig";
import { Level, trace } from "@ext/loggers/opentelemetry";

class EnterpriseManager {
	private _isOff = false;

	constructor(
		private _defaultConfig: EnterpriseConfig,
		private _config?: YamlFileConfig<EnterpriseConfig>,
	) {}

	getConfig() {
		if (this._isOff) return {};
		return { ...this._defaultConfig, ...(this._config?.inner?.() ?? {}) };
	}

	@trace({ level: Level.Important })
	async setGesUrl(gesUrl: string) {
		this._config?.set("gesUrl", gesUrl);
		await this._config?.save();
	}

	@trace({ level: Level.Important })
	async clearGesUrl() {
		this._config?.delete("gesUrl");
		await this._config?.save();
	}

	off() {
		this._isOff = true;
	}
}

export default EnterpriseManager;
