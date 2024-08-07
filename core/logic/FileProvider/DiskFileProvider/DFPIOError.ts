export interface IoErrorBuilder {
	name: string;
	message: string;
}

export default class IoError extends Error {
	code: string;

	constructor(err: IoErrorBuilder | string, message?: string) {
		super(typeof err == "string" ? err : err.message);
		message && (this.message += "\n" + message);
		if (typeof err == "string") return;

		this.name = err.name;
		this.code = err.name;
	}
}
