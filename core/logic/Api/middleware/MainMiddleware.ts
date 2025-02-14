import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import { apiUtils } from "../apiUtils";
import Middleware from "./Middleware";

export class MainMiddleware extends Middleware {
	constructor(private _path?: string) {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		// await applyCors(req, res);
		const isEnterprise = !!this._app.em.getConfig().gesUrl;
		res.statusCode = 200;
		try {
			await this._next.Process(req, res);
		} catch (e) {
			let defaultError: DefaultError;

			if (e instanceof DefaultError) {
				defaultError = e;
				// if (defaultError?.cause) this._app.logger.logError(this._getPathError(defaultError.cause));
			} else {
				const error = this._getPathError(e);
				this._app.logger.logError(error);
				defaultError = new DefaultError(
					isEnterprise ? t("app.error.command-failed.body-enterprise") : t("app.error.command-failed.body"),
					error,
					{ html: true, showCause: true },
					false,
					t("app.error.command-failed.title"),
				);
			}
			if (isEnterprise) defaultError.setShowCause(false);
			apiUtils.sendError(res, defaultError);
		}
	}

	private _getPathError(e: Error): Error {
		if (!this._path) return e;
		const command = this._path;
		const error = new Error(`${command} ${e.message}`);
		if (error.stack?.includes("Error:")) error.stack = e.stack.replace("Error:", `Error: ${command}`);
		else error.stack = `Command: ${command}\nError: ${e.name}\nMessage: ${e.message}\n\n${e.stack}`;
		return error;
	}
}
