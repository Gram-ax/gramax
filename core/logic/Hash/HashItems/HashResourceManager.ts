import type Context from "@core/Context/Context";
import { isLikelyLfsPointer } from "@core/GitLfs/logic/isLikelyLfsPointer";
import isImage, { isImageByExtension } from "@core/utils/isImage";
import { HealthcheckStatus } from "@ext/healthcheck/HealthChecker";
import type { HealthcheckRegistry } from "@ext/healthcheck/HealthCheckRegistry";
import type { Buffer } from "buffer";
import type Path from "../../FileProvider/Path/Path";
import type ResourceManager from "../../Resource/ResourceManager";
import HashItem from "./HashItem";

export default class HashResourceManager extends HashItem {
	constructor(
		private _path: Path,
		private _resourceManager: ResourceManager,
		private _ctx: Context,
		private _healthcheckRegistry?: HealthcheckRegistry,
	) {
		super();
	}

	public getKey(): string {
		return `${this._resourceManager?.basePath?.value ?? ""}@${this._path?.value ?? ""}`;
	}

	public async getContent(): Promise<string> {
		return (await this._resourceManager.getContent(this._path, this._ctx))?.toString() ?? "";
	}

	public getHashContent(): Promise<string> {
		return this.getContent();
	}

	public async getContentAsBinary(): Promise<Buffer> {
		const content = (await this._resourceManager.getContent(this._path, this._ctx)) ?? null;
		const path = this._resourceManager.getAbsolutePath(this._path).value;
		const isNullContent = !content;
		const isNoImage = content && isImageByExtension(this._path.extension) && !isImage(content);
		const isLfsPointer = isLikelyLfsPointer(content);
		if (isNullContent || isLfsPointer || isNoImage) {
			this._healthcheckRegistry?.saveResult({
				name: `resource-manager${isNullContent ? "-isNullContent" : ""}${isLfsPointer ? "-isLfsPointer" : ""}${isNoImage ? "-isNoImage" : ""}-${path}`,
				res: {
					status: HealthcheckStatus.UNHEALTHY,
					message: `Resource is broken`,
					timestamp: new Date(),
				},
			});
		} else {
			const result = this._healthcheckRegistry?.checkResultByIncludesName(`-${path}`);
			if (result) {
				this._healthcheckRegistry?.saveResult({
					name: result.name,
					res: {
						status: HealthcheckStatus.HEALTHY,
						message: "Resource was broken, but fixed",
						timestamp: result.res.timestamp,
					},
				});
			}
		}
		return content;
	}
}
