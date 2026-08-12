import type { EnterpriseCloudConfig } from "@app/config/AppConfig";
import type YamlFileConfig from "@core/utils/YamlFileConfig";
import type { AppConfigWithGesCloud } from "@ext/enterprise-cloud/config/AppConfigWithGesCloud";
import { Level, trace } from "@ext/loggers/opentelemetry";

export class GesCloudManager {
	constructor(
		private readonly _defaultConfig: EnterpriseCloudConfig,
		private readonly _config?: YamlFileConfig<AppConfigWithGesCloud>,
	) {}

	getConfig(): EnterpriseCloudConfig {
		return {
			...this._defaultConfig,
			...(this._config?.inner?.()?.cloud ?? {}),
		};
	}

	@trace({ level: Level.Important })
	disable() {
		const config = this._config?.inner?.() ?? ({} as AppConfigWithGesCloud);
		this._config?.set("cloud", { ...config.cloud, enabled: false });
		return this._config?.save();
	}

	@trace({ level: Level.Important })
	enable() {
		const config = this._config?.inner?.() ?? ({} as AppConfigWithGesCloud);
		this._config?.set("cloud", { ...config.cloud, enabled: true });
		return this._config?.save();
	}

	@trace({ level: Level.Important })
	async setGesCloudUrl(gesCloudUrl: string) {
		const config = this._config?.inner?.() ?? ({} as AppConfigWithGesCloud);
		this._config?.set("cloud", { ...config.cloud, url: gesCloudUrl });
		await this._config?.save();
	}
}
