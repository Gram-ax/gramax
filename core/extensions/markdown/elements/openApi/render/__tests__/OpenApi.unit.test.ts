import sendBug from "@ext/bugsnag/logic/sendBug";
import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import type { OpenApiDiagnostic } from "@gramax/openapi-viewer";
import { act, render } from "@testing-library/react";
import { createElement } from "react";

jest.mock("@ext/bugsnag/logic/sendBug", () => jest.fn());

jest.mock("@core-ui/ContextServices/ApiUrlCreator", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	__esModule: true,
	default: { value: {} },
}));
jest.mock("@core-ui/ContextServices/ResourceService/ResourceService", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	__esModule: true,
	default: { value: {} },
}));

// The resource layer is replaced by a hand-driven one: the test decides when a spec arrives, so a load is a
// plain await instead of a timing race against the real fetch pipeline.
jest.mock("@core-ui/ContextServices/ResourceService/hooks/useGetResource", () => {
	const mockState: { deliver?: (text: string) => Promise<void> } = {};
	return {
		useGetResource: (callback: (buffer: Buffer, error?: unknown) => Promise<void> | void) => {
			mockState.deliver = async (text: string) => {
				await callback(Buffer.from(text));
			};
		},
		mockState,
	};
});

// Stands in for the lazily-loaded custom-element wrapper: it can be told to blow up during render (a bug
// reached through the React tree) and it hands its props back so the test can also fire the element's own
// error event (a bug reached from a DOM handler, outside the React stack).
jest.mock("@ext/markdown/elements/openApi/render/OpenApiViewer", () => {
	const react = require("react");
	const mockState: { throwOnRender: boolean; props?: ViewerProps } = { throwOnRender: false };
	const OpenApiViewer = (props: unknown) => {
		mockState.props = props as ViewerProps;
		if (mockState.throwOnRender) throw new Error("viewer exploded");
		return react.createElement("div", { "data-testid": "openapi-viewer" });
	};
	// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
	return { __esModule: true, default: OpenApiViewer, mockState };
});

jest.mock("@ext/markdown/elements/comment/edit/components/View/BlockCommentView", () => {
	const react = require("react");
	return {
		// biome-ignore lint/style/useNamingConvention: Jest ESM mock marker
		__esModule: true,
		default: ({ children }: { children: unknown }) => react.createElement(react.Fragment, null, children),
	};
});

interface ViewerProps {
	hideInfo?: boolean;
	showDiagnostics?: boolean;
	onError?: (error: Error, phase: string, diagnostics: OpenApiDiagnostic[]) => void;
	onRendered?: (diagnostics: OpenApiDiagnostic[]) => void;
}

const resource = jest.requireMock("@core-ui/ContextServices/ResourceService/hooks/useGetResource").mockState as {
	deliver: (text: string) => Promise<void>;
};
const viewer = jest.requireMock("@ext/markdown/elements/openApi/render/OpenApiViewer").mockState as {
	throwOnRender: boolean;
	props?: ViewerProps;
};

const SRC = "./api/petstore.yaml";
const SPEC = [
	'openapi: "3.0.1"',
	"info:",
	"  title: Petstore",
	"  version: 1.0.0",
	'  description: "contact support with token s3cr3t-token-value"',
	"paths:",
	"  /pets:",
	"    get:",
	"      responses:",
	'        "200":',
	"          description: OK",
	"",
].join("\n");

const renderArticle = (props: { isEditing?: boolean; isPrint?: boolean; showInfo?: boolean } = { isEditing: true }) =>
	render(
		createElement(
			"div",
			null,
			createElement("span", { "data-testid": "sibling" }, "rest of the article"),
			createElement(OpenApi, { src: SRC, ...props }),
		),
	);

describe("OpenAPI info visibility follows the node option", () => {
	beforeEach(() => {
		viewer.throwOnRender = false;
	});

	test.each([
		["the default", undefined, false],
		["showInfo=true", true, false],
		["showInfo=false", false, true],
	])("%s maps to the expected hideInfo value", async (_, showInfo, hideInfo) => {
		renderArticle({ showInfo });
		await act(async () => {
			await resource.deliver(SPEC);
		});

		expect(viewer.props?.hideInfo).toBe(hideInfo);
	});
});

/** Replays the callback sendBug was handed, against a stub event, and returns the metadata it added. */
const capturedMetadata = (call = 0): Record<string, unknown> => {
	const onError = (sendBug as jest.Mock).mock.calls[call][1] as (event: {
		addMetadata: (section: string, values: Record<string, unknown>) => void;
	}) => void;
	const added: Record<string, unknown> = {};
	onError({ addMetadata: (section, values) => Object.assign(added, { [section]: values }) });
	return added.openapi as Record<string, unknown>;
};

describe("OpenAPI D-path: a renderer bug is contained and reported", () => {
	let consoleError: jest.SpyInstance;
	// React (dev builds) rethrows a caught render error at the DOM level to keep its stack for devtools, and
	// jsdom logs that as an unhandled exception. Expected noise for a deliberately-thrown error.
	const onWindowError = (event: ErrorEvent) => event.preventDefault();

	beforeEach(() => {
		(sendBug as jest.Mock).mockClear();
		viewer.throwOnRender = false;
		consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
		window.addEventListener("error", onWindowError);
	});

	afterEach(() => {
		consoleError.mockRestore();
		window.removeEventListener("error", onWindowError);
	});

	test("a throw inside the viewer replaces the block with the placeholder and leaves the article working", async () => {
		const { getByTestId, queryByTestId, container } = renderArticle();

		// Render once cleanly first: the spec the report must describe has to be the loaded one, not the
		// empty placeholder the block starts with.
		await act(async () => {
			await resource.deliver(SPEC);
		});
		expect(queryByTestId("openapi-viewer")).toBeTruthy();

		viewer.throwOnRender = true;
		await act(async () => {
			await resource.deliver(SPEC);
		});

		expect(getByTestId("sibling")).toBeTruthy();
		expect(queryByTestId("openapi-viewer")).toBeNull();
		expect(container.textContent).toContain("Something went wrong");
		expect(container.textContent).toContain("The developers have already received an error report");
	});

	test("the report carries the reproduction context and neither the spec text nor its secrets", async () => {
		renderArticle();

		await act(async () => {
			await resource.deliver(SPEC);
		});
		viewer.throwOnRender = true;
		await act(async () => {
			await resource.deliver(SPEC);
		});

		expect(sendBug).toHaveBeenCalledTimes(1);
		expect(((sendBug as jest.Mock).mock.calls[0][0] as Error).message).toBe("viewer exploded");

		const metadata = capturedMetadata();
		expect(metadata).toEqual({
			path: SRC,
			phase: "render",
			version: "3.0.1",
			size: SPEC.length,
			diagnostics: [],
		});
		expect(JSON.stringify(metadata)).not.toContain("s3cr3t-token-value");
		expect(JSON.stringify(metadata)).not.toContain("Petstore");
	});

	test("an error event from the element's own handlers is reported with its phase and diagnostics", async () => {
		renderArticle();

		await act(async () => {
			await resource.deliver(SPEC);
		});
		expect(sendBug).not.toHaveBeenCalled();

		const diagnostic: OpenApiDiagnostic = {
			severity: "warning",
			path: "/paths/~1pets/get",
			code: "responses-missing",
			message: "responses is missing",
			expected: "responses object",
			received: "missing",
			action: "skipped",
		};
		act(() => {
			viewer.props?.onError?.(new Error("expand handler exploded"), "interaction", [diagnostic]);
		});

		expect(sendBug).toHaveBeenCalledTimes(1);
		expect(capturedMetadata()).toEqual({
			path: SRC,
			phase: "interaction",
			version: "3.0.1",
			size: SPEC.length,
			diagnostics: [diagnostic],
		});
	});

	test("the next successful render clears the placeholder instead of the error sticking", async () => {
		const { queryByTestId } = renderArticle();

		await act(async () => {
			await resource.deliver(SPEC);
		});
		act(() => {
			viewer.props?.onError?.(new Error("expand handler exploded"), "interaction", []);
		});
		expect(queryByTestId("openapi-viewer")).toBeNull();

		await act(async () => {
			await resource.deliver(SPEC.replace("Petstore", "Petstore v2"));
		});

		expect(queryByTestId("openapi-viewer")).toBeTruthy();
	});
});

// Criterion 4's reader half. That showDiagnostics=false actually hides the panel is the core's own contract
// (asserted in the viewer package's own browser smoke); what belongs here is the link the adapter
// owns -- turning "who is looking at this article" into that flag.
describe("OpenAPI U4 panel visibility follows the viewing mode", () => {
	beforeEach(() => {
		(sendBug as jest.Mock).mockClear();
		viewer.throwOnRender = false;
	});

	const deliverAndReadFlag = async (props: { isEditing?: boolean; isPrint?: boolean }) => {
		renderArticle(props);
		await act(async () => {
			await resource.deliver(SPEC);
		});
		return viewer.props?.showDiagnostics;
	};

	test("an author editing the article gets the diagnostics panel", async () => {
		expect(await deliverAndReadFlag({ isEditing: true })).toBe(true);
	});

	test("a reader does not: the block renders the valid part with no panel", async () => {
		expect(await deliverAndReadFlag({ isEditing: false })).toBe(false);
	});

	test("printing hides the panel even for an author", async () => {
		expect(await deliverAndReadFlag({ isEditing: true, isPrint: true })).toBe(false);
	});
});
