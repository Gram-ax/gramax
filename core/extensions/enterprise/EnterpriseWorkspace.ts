import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { PredefinedAssets } from "@ext/workspace/WorkspaceAssets";
import { Workspace } from "../workspace/Workspace";
import { svgToBase64 } from "@core/utils/CustomLogoDriver";
import { XxHash } from "@core/Hash/Hasher";

export class EnterpriseWorkspace extends Workspace {
	private _updateInterval: number = 1000 * 60 * 15; // 15 minutes
	private _configHash: string = "";

	async config() {
		await this._updateConfig();
		return this._config.inner();
	}

	private async _updateConfig() {
		const timeDiff = Date.now() - this._updateInterval;
		if (Number(this._config.get("enterprise")?.lastUpdateDate) > timeDiff) return;

		const gesUrl = this._config.get("enterprise")?.gesUrl || this._config.get("gesUrl");
		this._config.set("enterprise", { ...this._config.get("enterprise"), lastUpdateDate: Date.now() });
		this._config.delete("gesUrl");

		const clientConfig = {
			name: this._config.get("name"),
			groups: this._config.get("groups"),
			style: {
				css: await this._assets.get(PredefinedAssets.customStyle),
				logo: (async () => {
					const iconData = await this._assets.get(PredefinedAssets.lightHomeIcon);
					if (!iconData) return "";
					return Buffer.from(iconData.split(",")[1], "base64").toString();
				})(),
				logoDark: (async () => {
					const iconData = await this._assets.get(PredefinedAssets.darkHomeIcon);
					if (!iconData) return "";
					return Buffer.from(iconData.split(",")[1], "base64").toString();
				})(),
			},
			authMethods: this._config.get("enterprise")?.authMethods || [],
		};

		const hasher = XxHash.hasher();
		hasher.hash(clientConfig);
		this._configHash = hasher.finalize().toString();

		const config = await new EnterpriseApi(gesUrl).getWorkspaceConfig(this._configHash);

		if (!config) return;
		this._config.set("name", config.name);
		this._config.set("icon", config.icon);
		this._config.set("groups", config.groups);
		this._config.set("enterprise", {
			...this._config.get("enterprise"),
			authMethods: config.authMethods,
		});

		config.style?.css
			? await this._assets.write(PredefinedAssets.customStyle, config.style.css)
			: await this._assets.delete(PredefinedAssets.customStyle);

		config.style?.logo
			? await this._assets.write(PredefinedAssets.lightHomeIcon, svgToBase64(config.style.logo))
			: await this._assets.delete(PredefinedAssets.lightHomeIcon);

		config.style?.logoDark
			? await this._assets.write(PredefinedAssets.darkHomeIcon, svgToBase64(config.style.logoDark))
			: await this._assets.delete(PredefinedAssets.darkHomeIcon);

		await this._config.save();
	}
}
