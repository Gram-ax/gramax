const { cancelAnimationFrame, requestAnimationFrame } = require("request-animation-frame-polyfill");
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.window = {
	requestAnimationFrame,
	cancelAnimationFrame,
};

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
