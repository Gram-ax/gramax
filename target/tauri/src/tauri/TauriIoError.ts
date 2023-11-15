export interface TauriIoErrorBuilder {
	name: string;
	message: string;
}

export default class TauriIoError extends Error {
	code: string;

	constructor(err: TauriIoErrorBuilder | string, message: string) {
		super(typeof err == "string" ? err : err.message);
		this.message += "\n" + message;
		if (typeof err == "string") return;

		this.name = err.name;
		this.code = err.name;
	}
}
