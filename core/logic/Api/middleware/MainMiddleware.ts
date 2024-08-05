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
					t("app.error.command-failed.body"),
					error,
					{ html: true, showCause: true },
					false,
					t("app.error.command-failed.title"),
				);
			}
			apiUtils.sendError(res, defaultError);
		}
	}

	private _getPathError(e: Error): Error {
		if (!this._path) return e;
		const command = `Command:${this._path}`;
		const error = new Error(`${command} ${e.message}`);
		error.stack = e.stack.replace("Error:", `Error: ${command}`);
		return error;
	}
}
