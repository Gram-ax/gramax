import ErrorType from "../model/ErrorTypes";

export default class DefaultError extends Error {
	constructor(
		message: string,
		public cause?: Error,
		protected _props?: { [key: string]: any } & { errorCode?: string },
		public isWarning = false,
		public title?: string,
		public icon?: string
	) {
		if (cause) console.error(cause);
		super(message ?? cause?.message, { cause });
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
