import getAppVersion from "@core/utils/getAppVersion";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import t from "@ext/localization/locale/translate";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import { apiUtils } from "../apiUtils";
import Middleware from "./Middleware";

export class MainMiddleware extends Middleware {
	private _ignoreErrorInstances = [DefaultError, NetworkApiError];

	constructor(private _path?: string) {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		// await applyCors(req, res);
		const isEnterprise = !!this._app.em.getConfig().gesUrl;
		const appVersion = getAppVersion(this._app.conf?.version, this._app.conf?.isRelease);
		res.statusCode = 200;
		try {
			await this._next.Process(req, res);
		} catch (e) {
			let defaultError: DefaultError;
			if (this._ignoreErrorInstances.some((instance) => e instanceof instance)) {
				defaultError = e;
			} else {
				const error = this._getPathError(e);
				this._app.logger.logError(error, true);
				defaultError = new DefaultError(
					t("app.error.command-failed.body"),
					error,
					{ html: true, showCause: true, version: appVersion },
					false,
					t("app.error.command-failed.title"),
				);
			}
			if (isEnterprise) defaultError.setShowCause(false);
			if (defaultError.props?.logCause && defaultError.cause) {
				console.error({ version: appVersion, cause: defaultError.cause });
			}
			if (defaultError?.cause?.stack && defaultError.props?.version) {
				defaultError.cause.stack = this._addVersionToStack(
					defaultError.props.version,
					defaultError.cause.stack,
				);
			}
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

	private _addVersionToStack = (version: string, stack?: string): string => {
		const versionLine = `Version: ${version}`;
		if (!stack) return versionLine;
		if (stack.includes(versionLine)) return stack;
		return `${versionLine}\n${stack}`;
	};
}
