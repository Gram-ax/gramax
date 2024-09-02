import GitErrorProps from "@ext/git/core/GitCommands/errors/model/GitErrorProps";
import DefaultError from "../../../../errorHandlers/logic/DefaultError";
import ErrorType from "../../../../errorHandlers/model/ErrorTypes";
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
		isWarninig?: boolean,
		title?: string,
	) {
		const currentCaller = GitError._getCaller(caller, _defaultError);
		const currentProps = { ...props, caller: currentCaller, errorCode: _errorCode, errorData: _defaultError?.data };
		const {
			message,
			title: gitErrorTitle,
			showMessage,
		} = GitError._getMessage(_errorCode, _defaultError, currentCaller, currentProps);
		super(message, _defaultError, currentProps, isWarninig, title ?? gitErrorTitle);
		this.props.html = true;
		this._caller = currentCaller;
		if (showMessage) {
			this.props.showCause = true;
			this.cause = { stack: this._defaultError.message, name: this.name, message: this._defaultError.message };
		}
	}

	setProps(props: { [key: string]: any }): void {
		this._props = { ...this.props, ...props };
		const { message, title: gitErrorTitle, showMessage } = GitError._getMessage(
			this._errorCode,
			this._defaultError,
			this._caller,
			this._props,
		);
		this.message = message;
		this.title = props.title ?? gitErrorTitle;
		if (showMessage) {
			this.props.showCause = true;
			this.cause = { stack: this._defaultError.message, name: this.name, message: this._defaultError.message };
		}
	}

	get props(): GitErrorProps {
		return this._props;
	}

	override get type() {
		return ErrorType.Git;
	}

	private static _getMessage(errorCode: GitErrorCode, defaultError: any, caller: Caller, props: GitErrorProps) {
		if (defaultError?.message) console.error("Error message:\n", defaultError?.message);
		if (defaultError?.data) console.error("Error data:\n", defaultError?.data);
		return gitErrorLocalization[errorCode]({
			caller,
			error: {
				data: defaultError?.data,
				message: defaultError?.message,
				props,
			},
		});
	}

	private static _getCaller(caller: Caller, defaultError: any): Caller {
		return caller ?? defaultError?.caller?.slice(4); // отрезаем "git."" если caller пришёл из ошибки
	}
}
