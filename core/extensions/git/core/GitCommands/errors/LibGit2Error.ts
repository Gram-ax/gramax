import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";

export const JSErrorClass = 100;

export class LibGit2Error extends Error {
	code?: GitErrorCode;
	data?: { [key: string]: string };

	constructor(message: string, klass: number, code: number) {
		super(message);
		this.code = fromRaw(klass, code);
		this.data = makeData(this.code, message);
	}
}

export const fromRaw = (klass: number, code: number): GitErrorCode => {
	const eq = (targetKlass: number, targetCode: number) => targetKlass == klass && targetCode == code;

	switch (true) {
		case eq(20, 11):
		case eq(13, 20):
			return GitErrorCode.CheckoutConflictError;

		case eq(22, 22):
		case eq(22, 11):
		case eq(22, 0):
		case eq(10, 8):
		case eq(19, 20):
			return GitErrorCode.MergeConflictError;

		case eq(12, 19):
			return GitErrorCode.GitPushError;

		case eq(4, 4):
			return GitErrorCode.AlreadyExistsError;

		case eq(34, 16):
		case eq(34, 0):
			return GitErrorCode.HttpError;

		case eq(4, 9):
			return GitErrorCode.PushRejectedError;

		case eq(2, 0):
			return GitErrorCode.NetworkConntectionError;

		case eq(14, 1):
			return GitErrorCode.FileNotFoundError;

		case eq(JSErrorClass, 19):
			return GitErrorCode.NetworkConntectionError;

		default:
			return undefined;
	}
};

export const makeData = (code: GitErrorCode, message: string): any => {
	switch (code) {
		case GitErrorCode.PushRejectedError:
			return {
				reason: "not-fast-forward",
			};

		case GitErrorCode.HttpError:
			return {
				statusCode: message,
			};

		default:
			return undefined;
	}
};
