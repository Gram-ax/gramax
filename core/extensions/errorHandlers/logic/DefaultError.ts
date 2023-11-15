import ErrorType from "../model/ErrorTypes";

export default class DefaultError extends Error {
	constructor(
		message: string,
		cause?: Error,
		protected _props?: { [key: string]: any } & { errorCode?: string },
	) {
		super(message, { cause });
	}

	setProps(props: { [key: string]: any }): void {
		this._props = { ...this.props, ...props };
	}

	get props(): { [key: string]: any } & { errorCode: string } {
		return { errorCode: "default", ...this._props };
	}

	get type() {
		return ErrorType.Default;
	}
}
