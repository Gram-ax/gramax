const { cancelAnimationFrame, requestAnimationFrame } = require("request-animation-frame-polyfill");
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.window = {
	requestAnimationFrame,
	cancelAnimationFrame,
};

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

delete process.env.CORS_PROXY_SERVICE_URL;

jest.setTimeout(15000);
