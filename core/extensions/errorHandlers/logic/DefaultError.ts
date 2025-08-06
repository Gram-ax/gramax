import ErrorType from "../model/ErrorTypes";

type DefaultErrorProps = { [key: string]: any } & { errorCode?: string; showCause?: boolean; logCause?: boolean };

export default class DefaultError extends Error {
	constructor(
		message: string,
		public cause?: Error,
		protected _props?: DefaultErrorProps,
		public isWarning = false,
		public title?: string,
		public icon?: string,
	) {
		if (cause) console.error(cause);
		super(message ?? cause?.message, { cause });
	}

	setProps(props: { [key: string]: any }): void {
		this._props = { ...this.props, ...props };
	}

	setShowCause(showCause: boolean): void {
		if (!this._props) this._props = { showCause };
		else this._props.showCause = showCause;
	}

	get props(): DefaultErrorProps {
		return { errorCode: "default", ...this._props };
	}

	get type() {
		return ErrorType.Default;
	}
}
