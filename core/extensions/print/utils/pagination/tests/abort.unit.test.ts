import { isPaginationAbortError, PaginationAbortError, throwIfAborted } from "../abort";

describe("pagination abort helpers", () => {
	it("throws PaginationAbortError when signal aborted", () => {
		const controller = new AbortController();
		expect(() => throwIfAborted(controller.signal)).not.toThrow();

		controller.abort("stop");
		expect(() => throwIfAborted(controller.signal)).toThrow(PaginationAbortError);
	});

	it("identifies PaginationAbortError", () => {
		const error = new PaginationAbortError("cancelled");
		expect(isPaginationAbortError(error)).toBe(true);
		expect(isPaginationAbortError(new Error("other"))).toBe(false);
	});
});
