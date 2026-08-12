const { cancelAnimationFrame, requestAnimationFrame } = require("request-animation-frame-polyfill");
const { TextEncoder, TextDecoder } = require("util");
const { deserialize, serialize } = require("v8");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// jest-environment-jsdom 29 / jsdom 20 doesn't expose Node's structuredClone global.
if (typeof globalThis.structuredClone === "undefined") {
	globalThis.structuredClone = (val) => deserialize(serialize(val));
}

// jsdom's `window` is unforgeable: the plain assignment that used to stand here never took
// effect (silently, in sloppy mode) and under bun it throws instead. Replacing it outright is
// not the fix — react-dom reads `window.HTMLIFrameElement` on every commit. Stub only when
// there is no window at all.
if (typeof global.window === "undefined") {
	Object.defineProperty(global, "window", {
		value: { requestAnimationFrame, cancelAnimationFrame },
		writable: true,
		configurable: true,
	});
}

Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // Deprecated
		removeListener: jest.fn(), // Deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

global.VITE_ENVIRONMENT = "test";

if (!process.env.DEBUG_JEST) {
	global.console = {
		...console,
		log: jest.fn(),
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		disabled: true,
	};
}

delete process.env.GIT_PROXY_SERVICE_URL;

if (typeof globalThis.ResizeObserver === "undefined") {
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

global.Worker = class {
	postMessage() {}
	terminate() {}
	addEventListener() {}
	removeEventListener() {}
	set onmessage(_fn) {}
	set onerror(_fn) {}
};

jest.setTimeout(15000);

jest.mock("ics-ui-kit/components/textarea", () => ({
	Textarea: "textarea",
	AutogrowTextarea: "textarea",
}));

jest.mock("ics-ui-kit/components/dialog", () => ({
	Dialog: "div",
	DialogContent: "div",
	DialogBody: "div",
}));

// https://github.com/jsdom/jsdom/pull/3556
if (!AbortSignal.prototype.throwIfAborted) {
	AbortSignal.prototype.throwIfAborted = function () {
		if (this.aborted) throw this.reason;
	};
}
