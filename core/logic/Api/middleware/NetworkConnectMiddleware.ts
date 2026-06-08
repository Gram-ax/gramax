import { getExecutingEnvironment } from "@app/resolveModule/env";
import NetworkError from "@ext/errorHandlers/network/NetworkError";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import type Query from "../Query";
import Middleware from "./Middleware";

export class NetworkConnectMiddleware extends Middleware {
	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		try {
			await this._next.Process(req, res);
		} catch (error) {
			const sourceName = await this._getSourceName(req);
			if (!sourceName) throw error;

			const ctx = await this._buildContext(req, res);
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
		const catalogName = req.query?.catalogName;
		if (catalogName && typeof catalogName === "string") {
			return catalogName.split("/")[0];
		}

		return undefined;
	}

	private async _buildContext(req: ApiRequest, res: ApiResponse) {
		const query = req.query as Query;
		const env = getExecutingEnvironment();

		if (env === "browser" || env === "tauri") {
			const queryLanguage = Array.isArray(query?.l) ? query?.l[0] : query?.l;
			const language = typeof queryLanguage === "string" ? queryLanguage : "en";
			return this._app.contextFactory.fromBrowser({ language, query });
		}

		return this._app.contextFactory.fromNode({ req, res, query });
	}
}
