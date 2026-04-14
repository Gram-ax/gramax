class AssertionError extends Error {
	actual: unknown;
	expected: unknown;
	operator: string;

	constructor({ message, actual, expected, operator }: { message?: string; actual?: unknown; expected?: unknown; operator?: string }) {
		super(message ?? `${String(actual)} ${operator} ${String(expected)}`);
		this.name = "AssertionError";
		this.actual = actual;
		this.expected = expected;
		this.operator = operator ?? "==";
	}
}

function toError(message?: string | Error): Error {
	if (message instanceof Error) return message;
	return new AssertionError({ message: message ?? "Assertion failed", operator: "ok" });
}

function assert(value: unknown, message?: string | Error): asserts value {
	if (!value) throw toError(message);
}

assert.ok = assert;

assert.fail = function fail(message?: string | Error): never {
	throw toError(message ?? "Failed");
};

assert.equal = function equal(actual: unknown, expected: unknown, message?: string | Error): void {
	// eslint-disable-next-line eqeqeq
	if (actual != expected) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual, expected, operator: "==" });
	}
};

assert.notEqual = function notEqual(actual: unknown, expected: unknown, message?: string | Error): void {
	// eslint-disable-next-line eqeqeq
	if (actual == expected) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual, expected, operator: "!=" });
	}
};

assert.strictEqual = function strictEqual(actual: unknown, expected: unknown, message?: string | Error): void {
	if (!Object.is(actual, expected)) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual, expected, operator: "===" });
	}
};

assert.notStrictEqual = function notStrictEqual(actual: unknown, expected: unknown, message?: string | Error): void {
	if (Object.is(actual, expected)) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual, expected, operator: "!==" });
	}
};

function isDeepEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const keysA = Object.keys(a as object);
	const keysB = Object.keys(b as object);
	if (keysA.length !== keysB.length) return false;
	return keysA.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

assert.deepEqual = function deepEqualFn(actual: unknown, expected: unknown, message?: string | Error): void {
	if (!isDeepEqual(actual, expected)) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual, expected, operator: "deepEqual" });
	}
};

assert.notDeepEqual = function notDeepEqualFn(actual: unknown, expected: unknown, message?: string | Error): void {
	if (isDeepEqual(actual, expected)) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual, expected, operator: "notDeepEqual" });
	}
};

assert.deepStrictEqual = assert.deepEqual;
assert.notDeepStrictEqual = assert.notDeepEqual;

assert.match = function match(value: string, regexp: RegExp, message?: string | Error): void {
	if (!regexp.test(value)) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual: value, expected: regexp, operator: "match" });
	}
};

assert.doesNotMatch = function doesNotMatch(value: string, regexp: RegExp, message?: string | Error): void {
	if (regexp.test(value)) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message, actual: value, expected: regexp, operator: "doesNotMatch" });
	}
};

assert.ifError = function ifError(value: unknown): void {
	if (value !== null && value !== undefined) {
		throw value instanceof Error ? value : new AssertionError({ message: String(value), operator: "ifError" });
	}
};

assert.throws = function throws(fn: () => unknown, expected?: RegExp | (new (...args: unknown[]) => unknown) | Error | string, message?: string): void {
	try {
		fn();
	} catch (err) {
		if (!expected) return;
		if (typeof expected === "string") { message = expected; expected = undefined; }
		if (expected instanceof RegExp && !(expected as RegExp).test(String(err))) {
			throw new AssertionError({ message, actual: err, expected, operator: "throws" });
		}
		if (typeof expected === "function" && !(err instanceof (expected as new (...args: unknown[]) => unknown))) {
			throw new AssertionError({ message, actual: err, expected, operator: "throws" });
		}
		return;
	}
	throw new AssertionError({ message: message ?? "Missing expected exception", operator: "throws" });
};

assert.doesNotThrow = function doesNotThrow(fn: () => unknown, message?: string | Error): void {
	try {
		fn();
	} catch (err) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message ?? "Got unwanted exception", actual: err, operator: "doesNotThrow" });
	}
};

assert.rejects = async function rejects(fn: () => Promise<unknown>, message?: string | Error): Promise<void> {
	try {
		await fn();
	} catch {
		return;
	}
	throw new AssertionError({ message: message instanceof Error ? message.message : message ?? "Missing expected rejection", operator: "rejects" });
};

assert.doesNotReject = async function doesNotReject(fn: () => Promise<unknown>, message?: string | Error): Promise<void> {
	try {
		await fn();
	} catch (err) {
		throw new AssertionError({ message: message instanceof Error ? message.message : message ?? "Got unwanted rejection", actual: err, operator: "doesNotReject" });
	}
};

assert.AssertionError = AssertionError;

export default assert;
export { AssertionError };
export const ok = assert.ok;
export const fail = assert.fail;
export const equal = assert.equal;
export const notEqual = assert.notEqual;
export const strictEqual = assert.strictEqual;
export const notStrictEqual = assert.notStrictEqual;
export const deepEqual = assert.deepEqual;
export const notDeepEqual = assert.notDeepEqual;
// biome-ignore lint: re-export aliases
export const deepStrictEqual = assert.deepStrictEqual;
export const notDeepStrictEqual = assert.notDeepStrictEqual;
export const match = assert.match;
export const doesNotMatch = assert.doesNotMatch;
export const ifError = assert.ifError;
export const throws = assert.throws;
export const doesNotThrow = assert.doesNotThrow;
export const rejects = assert.rejects;
export const doesNotReject = assert.doesNotReject;
