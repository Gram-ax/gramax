import type FileProvider from "@core/FileProvider/model/FileProvider";
import { StyleAsset } from "./assets/StyleAsset";
import { LogoAsset } from "./assets/LogoAsset";
import { PluginsAsset } from "./assets/PluginsAsset";
import { TemplateAsset } from "./assets/TemplateAsset";

export default class WorkspaceAssets {
	readonly style: StyleAsset;
	readonly logo: LogoAsset;
	readonly plugins: PluginsAsset;
	readonly wordTemplates: TemplateAsset;
	readonly pdfTemplates: TemplateAsset;

	constructor(private readonly _fp: FileProvider) {
		this.style = new StyleAsset(this._fp);
		this.logo = new LogoAsset(this._fp);
		this.plugins = new PluginsAsset(this._fp);
		this.wordTemplates = new TemplateAsset("word", this._fp, ["doc", "dot"]);
		this.pdfTemplates = new TemplateAsset("pdf", this._fp, ["css"]);
	}
}
