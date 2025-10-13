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

jest.setTimeout(15000);
