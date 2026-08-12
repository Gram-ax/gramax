import OpenApiRenderBoundary from "@ext/markdown/elements/openApi/render/OpenApiRenderBoundary";
import { render } from "@testing-library/react";
import { createElement } from "react";

const Bomb = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) throw new Error("boom");
	return createElement("div", { "data-testid": "content" }, "ok");
};

describe("OpenApiRenderBoundary (D-path)", () => {
	let consoleError: jest.SpyInstance;
	// React (dev builds) rethrows the original error at the DOM level to preserve its stack trace for devtools;
	// jsdom's own window "error" listener then logs that as an unhandled exception. Both are expected noise
	// for a deliberately-thrown test error, not a real failure.
	const onWindowError = (event: ErrorEvent) => event.preventDefault();

	beforeEach(() => {
		consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
		window.addEventListener("error", onWindowError);
	});

	afterEach(() => {
		consoleError.mockRestore();
		window.removeEventListener("error", onWindowError);
	});

	test("catches a child render error, reports it, and renders nothing in its place", () => {
		const onError = jest.fn();

		const { getByTestId, queryByTestId } = render(
			createElement(
				"div",
				null,
				createElement("span", { "data-testid": "sibling" }, "rest of the article"),
				createElement(
					OpenApiRenderBoundary,
					{ onError, resetKey: 1 },
					createElement(Bomb, { shouldThrow: true }),
				),
			),
		);

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
		expect(onError.mock.calls[0][0].message).toBe("boom");

		// The rest of the article (a sibling outside the boundary) keeps working.
		expect(getByTestId("sibling")).toBeTruthy();
		expect(queryByTestId("content")).toBeNull();
	});

	test("does not stay stuck: a resetKey change clears the caught error and renders children again", () => {
		const onError = jest.fn();

		const { rerender, getByTestId, queryByTestId } = render(
			createElement(OpenApiRenderBoundary, { onError, resetKey: 1 }, createElement(Bomb, { shouldThrow: true })),
		);
		expect(queryByTestId("content")).toBeNull();

		rerender(
			createElement(OpenApiRenderBoundary, { onError, resetKey: 2 }, createElement(Bomb, { shouldThrow: false })),
		);

		expect(getByTestId("content")).toBeTruthy();
		expect(onError).toHaveBeenCalledTimes(1);
	});

	test("keeps rendering nothing across re-renders with the same resetKey", () => {
		const onError = jest.fn();

		const { rerender, queryByTestId } = render(
			createElement(OpenApiRenderBoundary, { onError, resetKey: 1 }, createElement(Bomb, { shouldThrow: true })),
		);

		rerender(
			createElement(OpenApiRenderBoundary, { onError, resetKey: 1 }, createElement(Bomb, { shouldThrow: false })),
		);

		expect(queryByTestId("content")).toBeNull();
	});
});
