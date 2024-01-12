import GitErrorProps from "@ext/git/core/GitCommands/errors/model/GitErrorProps";
import DefaultError from "../../../../errorHandlers/logic/DefaultError";
import ErrorType from "../../../../errorHandlers/model/ErrorTypes";
import { defaultLanguage } from "../../../../localization/core/model/Language";
import gitErrorLocalization from "./GitErrorLocalization";
import { Caller } from "./model/Caller";
import GitErrorCode from "./model/GitErrorCode";
import GitErrorContextProps from "./model/GitErrorContextProps";

export default class GitError extends DefaultError {
	private _caller: Caller;
	protected declare _props: GitErrorProps;
	constructor(
		private _errorCode: GitErrorCode,
		private _defaultError: any,
		props: Partial<GitErrorContextProps> & { [key: string]: any },
		caller?: Caller,
	) {
		const currentCaller = GitError._getCaller(caller, _defaultError);
		const currentProps = { ...props, caller: currentCaller, errorCode: _errorCode, errorData: _defaultError?.data };
		const message = GitError._getMessage(_errorCode, _defaultError, currentCaller, currentProps);
		super(message, _defaultError, currentProps);
		this._caller = currentCaller;
	}

	setProps(props: { [key: string]: any }): void {
		this._props = { ...this.props, ...props };
		this.message = GitError._getMessage(this._errorCode, this._defaultError, this._caller, this._props);
	}

	get props(): GitErrorProps {
		return this._props;
	}

	override get type() {
		return ErrorType.Git;
	}

	private static _getMessage(errorCode: GitErrorCode, defaultError: any, caller: Caller, props: GitErrorProps) {
		return errorCode === null
			? GitError._generateErrorMessage(defaultError)
			: gitErrorLocalization[errorCode]({
					lang: defaultLanguage,
					caller,
					error: {
						data: defaultError?.data,
						message: defaultError?.message,
						props,
					},
			  });
	}

	private static _generateErrorMessage(defaultError: any) {
		const messageString = `сообщение ошибки - ${defaultError.message}`;
		const codeString = defaultError.code ? `код ошибки - ${defaultError.code}` : "";
		const errorDataString = defaultError.data ? `errorData: ${JSON.stringify(defaultError.data)}` : "";
		return ["Неизвестная ошибка", messageString, codeString, errorDataString].filter((x) => x).join(", ");
	}

	private static _getCaller(caller: Caller, defaultError: any): Caller {
		return caller ?? defaultError?.caller?.slice(4); // отрезаем "git."" если caller пришёл из ошибки
	}
}
