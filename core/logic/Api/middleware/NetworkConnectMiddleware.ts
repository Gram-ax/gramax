import NetworkError from "@ext/errorHandlers/network/NetworkError";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";
import { buildContext, getQueryParam } from "./utils";

export class NetworkConnectMiddleware extends Middleware {
	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		try {
			await this._next.Process(req, res);
		} catch (error) {
			const sourceName = await this._getSourceName(req);
			if (!sourceName) throw error;

			const ctx = await buildContext(this._app, req, res);
			const result = await this._commands.storage.sourceData.healthcheck.do({ ctx, sourceName });
			if (result.isHealthy) throw error;

			throw new NetworkError({ basePath: this._app.conf.basePath.toString(), sourceName });
		}
	}

	private async _getSourceName(req: ApiRequest): Promise<string> {
		try {
			const catalogName = this._getCatalogName(req);
			if (!catalogName) return;

			const workspace = this._app.wm.current();
			const catalog = await workspace.getContextlessCatalog(catalogName);
			const storage = catalog?.repo.storage;
			if (!storage) return;

			return await storage.getSourceName();
		} catch {
			return;
		}
	}

	private _getCatalogName(req: ApiRequest): string | undefined {
		const catalogName = getQueryParam(req.query?.catalogName);
		if (catalogName) {
			return catalogName.split("/")[0];
		}

		return undefined;
	}
}
