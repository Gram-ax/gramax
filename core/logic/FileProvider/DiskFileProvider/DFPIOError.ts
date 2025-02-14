export interface IoErrorBuilder {
	name: string;
	code: string;
	message: string;
}

export default class IoError extends Error {
	code: string;

	constructor({ name, code, message, cause }: IoErrorBuilder & { cause?: Error }) {
		super(message, { cause });
		this.name = name;
		this.code = code;
	}
}
