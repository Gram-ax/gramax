import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";

export const JSErrorClass = 100;

export class LibGit2Error extends Error {
	code?: GitErrorCode;
	data?: { [key: string]: string };
	command?: string;

	constructor(name: string, message: string, subset: number, klass: number, code: number, command?: string) {
		super(message);
		this.name = name;
		this.command = command;
		this.code = fromRaw(subset, klass, code, message, command);
		this.data = makeData(this.code, code);
	}
}

export const fromRaw = (
	subset: number,
	klass: number,
	code: number,
	message: string,
	command?: string,
): GitErrorCode => {
	const eq = (targetKlass: number, targetCode: number) => targetKlass === klass && targetCode === code;

	switch (true) {
		// A full disk surfaces as a Rust io error whose Debug output carries `kind: StorageFull`
		// (Unix strerror: "No space left on device"). It can wrap almost any git operation (usually a
		// failed lock-file write on `add`), so match the message first — before any class/code branch —
		// to keep it from being misread as a broken repository.
		case message.includes("StorageFull") || message.includes("No space left on device"):
			return GitErrorCode.NotEnoughDiskSpace;

		case subset === 3:
			return GitErrorCode.HealthcheckFailed;

		// A locked index (`.git/index.lock`, class=Index/10 + code=Locked/14) breaks the catalog even when
		// `repo.healthcheck()` finds no bad objects (Rust reports subset=1 then). Classify it as a healthcheck
		// failure so the repo is marked broken and the recovery modal is shown (GES-80).
		case eq(10, 14):
			return GitErrorCode.HealthcheckFailed;

		case eq(20, 11):
		case eq(13, 20):
		case eq(20, 13):
			return GitErrorCode.CheckoutConflictError;

		case eq(22, 22):
		case eq(22, 11):
		case eq(22, 0):
		case eq(10, 8):
		case eq(10, 10):
		case eq(19, 20):
			return GitErrorCode.MergeConflictError;

		case eq(12, 19):
		case eq(12, 21):
			return GitErrorCode.GitPushError;

		case eq(4, 4):
			return GitErrorCode.AlreadyExistsError;

		case eq(4, 1):
		case eq(4, 3):
			return GitErrorCode.NotFoundError;

		case message.includes("unexpected http status code: 404") || code === 404:
			return GitErrorCode.RemoteRepositoryNotFoundError;

		case code === 401 || code === 403:
		case message.includes("too many redirects or authentication replays"):
		case message.includes("unexpected http status code: 403"):
		case message.includes("unexpected http status code: 401"):
			return GitErrorCode.NotAuthorizedError;

		case [413, 431, 422].some((c) => code === c || message.includes(`unexpected http status code: ${c}`)):
			return GitErrorCode.ContentTooLargeError;

		case eq(34, 16):
		case eq(34, 0):
		case code > 299:
			return GitErrorCode.HttpError;

		case eq(4, 9):
		case eq(4, 11):
			return GitErrorCode.PushRejectedError;

		case eq(2, 0) && !message.includes("file"):
			return GitErrorCode.NetworkConntectionError;

		// libgit2 GIT_ERROR_NET (class 12) — DNS/connection failures (e.g. "failed to resolve address for <host>").
		// Specific push net-codes (12/19, 12/21) are matched above; anything else net-class is a connectivity issue.
		case klass === 12 &&
			(message.includes("failed to resolve address") ||
				message.includes("could not resolve") ||
				message.includes("failed to connect") ||
				message.includes("failed to send request") ||
				message.includes("timed out") ||
				message.includes("connection")):
			return GitErrorCode.NetworkConntectionError;

		case klass === 14 && message.includes("does not exist in the given tree"):
			return GitErrorCode.FileNotFoundError;

		case command === "clone" &&
			(message.includes("indexer callback") ||
				message.includes("aborted") ||
				message.includes("no error") ||
				message.includes("-1")):
			return GitErrorCode.CancelledOperation;

		case eq(JSErrorClass, 19):
			return GitErrorCode.NetworkConntectionError;

		default:
			return undefined;
	}
};

// biome-ignore lint/suspicious/noExplicitAny: idc
export const makeData = (code: GitErrorCode, rawCode: number): any => {
	switch (code) {
		case GitErrorCode.PushRejectedError:
			return {
				reason: "not-fast-forward",
			};

		case GitErrorCode.HttpError:
			return {
				statusCode: rawCode > 99 ? rawCode : -1,
			};

		case GitErrorCode.RemoteRepositoryNotFoundError:
			return {
				statusCode: rawCode > 99 ? rawCode : 404,
			};

		default:
			return undefined;
	}
};
