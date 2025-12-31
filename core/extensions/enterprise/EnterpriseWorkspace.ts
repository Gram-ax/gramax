import { XxHash } from "@core/Hash/Hasher";
import { svgToBase64 } from "@core/utils/CustomLogoDriver";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { EnterpriseWorkspaceConfig } from "@ext/enterprise/types/UserSettings";
import { calcPluginsHash } from "@ext/enterprise/utils/calcPluginsHash";
import { calcTemplatesHash } from "@ext/enterprise/utils/calcTemplatesHash";
import Theme from "@ext/Theme/Theme";
import type { TemplateAsset } from "@ext/workspace/assets/TemplateAsset";
import { Workspace } from "../workspace/Workspace";

export class EnterpriseWorkspace extends Workspace {
	private _updateInterval: number = 1000 * 5; // * 15; // 15 minutes
	private _configHash: string = "";

	async config(forceUpdate = false) {
		await this._updateConfig(forceUpdate);
		return this._config.inner();
	}

	private async _updateConfig(forceUpdate = false) {
		if (!forceUpdate) {
			const timeDiff = Date.now() - (this._config.get("enterprise")?.refreshInterval ?? this._updateInterval);
			if (Number(this._config.get("enterprise")?.lastUpdateDate) > timeDiff) return;
		}

		const gesUrl = this._config.get("enterprise")?.gesUrl || this._config.get("gesUrl");
		this._config.set("enterprise", { ...this._config.get("enterprise"), lastUpdateDate: Date.now() });
		this._config.delete("gesUrl");

		const [customCss, { light: lightIconData, dark: darkIconData }] = await Promise.all([
			this._assets.style.getContent(),
			this._assets.logo.getAll(),
		]);
		const logo = lightIconData ? Buffer.from(lightIconData.split(",")[1], "base64").toString() : null;
		const logoDark = darkIconData ? Buffer.from(darkIconData.split(",")[1], "base64").toString() : null;

		const wordTemplatesFileNames = await this._assets.wordTemplates.list();
		const wordTemplates = [];
		for (const fileName of wordTemplatesFileNames) {
			const buffer = await this._assets.wordTemplates.getContent(fileName);
			wordTemplates.push({
				title: fileName,
				bufferBase64: buffer?.toString("base64") ?? "",
			});
		}
		const pdfTemplates = [];
		const pdfTemplatesFileNames = await this._assets.pdfTemplates.list();
		for (const fileName of pdfTemplatesFileNames) {
			const bufferBase64 = await this._assets.pdfTemplates.getContentAsString(fileName);
			pdfTemplates.push({
				title: fileName,
				bufferBase64: bufferBase64 ?? "",
			});
		}
		const plugins = await this._assets.plugins.getAll();
		const baseHasher = XxHash.hasher();

		baseHasher.hash({
			name: this._config.get("name"),
			sections: this._config.get("sections"),
			style: {
				css: customCss,
				logo,
				logoDark,
			},
			modules: this._config.get("enterprise")?.modules,
		});
		baseHasher.hash(calcTemplatesHash(wordTemplates));
		baseHasher.hash(calcTemplatesHash(pdfTemplates));
		baseHasher.hash(calcPluginsHash(plugins.plugins));

		this._configHash = baseHasher.finalize().toString();

		const config = await new EnterpriseApi(gesUrl).getClientWorkspace(this._configHash);

		if (!config) return;
		this._config.set("name", config.name);
		this._config.set("icon", config.icon);
		this._config.set("sections", config.sections || config.groups);
		this._config.delete("groups");
		this._config.set("enterprise", {
			...this._config.get("enterprise"),
			authMethods: config.authMethods,
			modules: config.modules,
		});
		if (this._config.get("pdfTemplates")) {
			this._config.delete("pdfTemplates");
		}
		if (this._config.get("wordTemplates")) {
			this._config.delete("wordTemplates");
		}

		config.style?.css ? await this._assets.style.setContent(config.style.css) : await this._assets.style.delete();
		config.style?.logo
			? await this._assets.logo.set(Theme.light, svgToBase64(config.style.logo))
			: await this._assets.logo.delete(Theme.light);

		config.style?.logoDark
			? await this._assets.logo.set(Theme.dark, svgToBase64(config.style.logoDark))
			: await this._assets.logo.delete(Theme.dark);

		await this._assets.plugins.sync(config.plugins);

		await this._updateTemplates(config);
		await this._config.save();

		await this.events.emit("config-updated", {});
	}

	private async _updateTemplates(config: EnterpriseWorkspaceConfig) {
		await this._updateTemplatesOfType(config.wordTemplates ?? [], this._assets.wordTemplates, "base64");
		await this._updateTemplatesOfType(config.pdfTemplates ?? [], this._assets.pdfTemplates, "utf-8");
	}

	private async _updateTemplatesOfType(
		newTemplates: { title: string; bufferBase64: string }[],
		templateAsset: TemplateAsset,
		encoding: "base64" | "utf-8",
	) {
		const prevTemplates = await templateAsset.list();

		// Remove templates that are no longer present
		const templatesToRemove = prevTemplates.filter((t) => !newTemplates.find((nt) => nt.title === t));
		if (templatesToRemove.length > 0) {
			await templateAsset.delete(templatesToRemove);
		}

		// Add or update templates
		await Promise.all(
			newTemplates.map(async (template) => {
				if (!template.bufferBase64) return;

				const existingContent = await templateAsset.getContent(template.title);

				if (!existingContent) {
					await templateAsset.add([
						{ name: template.title, buffer: Buffer.from(template.bufferBase64, encoding) },
					]);
					return;
				}

				const newTemplateBuffer = Buffer.from(template.bufferBase64, encoding);
				const existingHash = XxHash.hasher().hash(existingContent).finalize();
				const newHash = XxHash.hasher().hash(newTemplateBuffer).finalize();
				const needUpdate = existingHash !== newHash;

				if (!needUpdate) return;

				await templateAsset.add([{ name: template.title, buffer: newTemplateBuffer }]);
			}),
		);
	}
}
