import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { PredefinedAssets } from "@ext/workspace/WorkspaceAssets";
import { Workspace } from "../workspace/Workspace";
import { svgToBase64 } from "@core/utils/CustomLogoDriver";
import { XxHash } from "@core/Hash/Hasher";
import { EnterpriseWorkspaceConfig } from "@ext/enterprise/types/UserSettings";
import Path from "@core/FileProvider/Path/Path";
import { WORD_TEMPLATES_DIR } from "@ext/workspace/WorkspaceAssets";
import { calcTemplatesHash } from "@ext/enterprise/utils/calcTemplatesHash";

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

		const [customCss, lightIconData, darkIconData] = await Promise.all([
			this._assets.get(PredefinedAssets.customStyle),
			this._assets.get(PredefinedAssets.lightHomeIcon),
			this._assets.get(PredefinedAssets.darkHomeIcon),
		]);

		const logo = lightIconData ? Buffer.from(lightIconData.split(",")[1], "base64").toString() : null;
		const logoDark = darkIconData ? Buffer.from(darkIconData.split(",")[1], "base64").toString() : null;

		const wordTemplatesFileNames = await this._assets.listFiles(WORD_TEMPLATES_DIR);
		const wordTemplates = [];
		for (const fileName of wordTemplatesFileNames) {
			const buffer = await this._assets.getBuffer(Path.join(WORD_TEMPLATES_DIR, fileName));
			wordTemplates.push({
				title: fileName,
				bufferBase64: buffer.toString("base64"),
			});
		}

		const baseHasher = XxHash.hasher();
		baseHasher.hash({
			name: this._config.get("name"),
			groups: this._config.get("groups"),
			style: {
				css: customCss,
				logo,
				logoDark,
			},
			authMethods: this._config.get("enterprise")?.authMethods || [],
		});
		baseHasher.hash(calcTemplatesHash(wordTemplates));
		this._configHash = baseHasher.finalize().toString();

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

		await this._updateWordTemplates(config);

		await this._config.save();

		await this.events.emit("config-updated", {});
	}

	private async _updateWordTemplates(config: EnterpriseWorkspaceConfig) {
		const prevTemplates = await this._assets.listFiles(WORD_TEMPLATES_DIR);

		const newTemplates = config.wordTemplates ?? [];

		await Promise.all(
			prevTemplates
				.filter((t) => !newTemplates.find((nt) => nt.title === t))
				.map((t) => this._assets.delete(Path.join(WORD_TEMPLATES_DIR, t))),
		);

		await Promise.all(
			newTemplates.map(async (template) => {
				if (!template.bufferBase64) return;

				const existingContent = await this._assets.getBuffer(Path.join(WORD_TEMPLATES_DIR, template.title));

				if (!existingContent) {
					await this._assets.write(
						Path.join(WORD_TEMPLATES_DIR, template.title),
						Buffer.from(template.bufferBase64, "base64"),
					);
					return;
				}

				const newTemplateBuffer = Buffer.from(template.bufferBase64, "base64");

				const existingHash = XxHash.hasher().hash(existingContent).finalize();
				const newHash = XxHash.hasher().hash(newTemplateBuffer).finalize();

				const needUpdate = existingHash !== newHash;

				if (!needUpdate) return;

				await this._assets.write(Path.join(WORD_TEMPLATES_DIR, template.title), newTemplateBuffer);
			}),
		);
	}
}
