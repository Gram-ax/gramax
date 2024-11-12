// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Buffer } from "../../../../node_modules/buffer";

import { ptr2bytes, ptr2str, str2ptr } from "./utils";

self.Buffer = Buffer;
self.ptr2str = ptr2str;
self.ptr2bytes = ptr2bytes;
self.str2ptr = str2ptr;

/**
 * Javascript functions for emscripten http transport for nodejs and the browser using a webworker
 *
 * REFERENCE: https://github.com/petersalomonsen/wasm-git
 *
 */

const emscriptenhttpconnections = {};
let httpConnectionNo = 0;

Object.assign(Module, {
	emscriptenhttpconnect: function (url, buffersize, method, headers) {
		if (!method) {
			method = "GET";
		}

		const getStore = (key: number) => {
			self.wasm = { wasmMemory: Module.HEAPU8, _rfree: Module._rfree, _ralloc: Module._ralloc };
			const ptr = Module["_get_store"](key);
			const str = ptr2str(ptr);
			return str?.buf;
		};

		const proxy = getStore(1);
		const token = getStore(2);
		const gitServerUsername = getStore(3) || "git";
		const protocol = getStore(4);

		const xhr = new XMLHttpRequest();
		xhr.open(
			method,
			proxy && proxy !== "null" ? proxy + url.replace(/https?:\/\//, `/${gitServerUsername}:$token$@`) : url,
			false,
		);
		xhr.responseType = "arraybuffer";
		xhr.setRequestHeader("x-private-token", token);
		if (protocol) xhr.setRequestHeader("x-protocol", protocol);

		if (headers) Object.keys(headers).forEach((header) => xhr.setRequestHeader(header, headers[header]));

		emscriptenhttpconnections[httpConnectionNo] = {
			xhr: xhr,
			resultbufferpointer: 0,
			buffersize: buffersize,
		};

		if (method === "GET") xhr.send();
		return httpConnectionNo++;
	},

	emscriptenhttpwrite: function (connectionNo, buffer, length) {
		const connection = emscriptenhttpconnections[connectionNo];
		const buf = new Uint8Array(Module.HEAPU8.buffer, buffer, length).slice(0);
		if (!connection.content) {
			connection.content = buf;
		} else {
			const content = new Uint8Array(connection.content.length + buf.length);
			content.set(connection.content);
			content.set(buf, connection.content.length);
			connection.content = content;
		}
	},

	emscriptenhttpread: function (connectionNo, buffer, buffersize) {
		const connection = emscriptenhttpconnections[connectionNo];
		if (connection.content) {
			connection.xhr.send(connection.content.buffer);
			connection.content = null;
		}
		let bytes_read = connection.xhr.response.byteLength - connection.resultbufferpointer;
		if (bytes_read > buffersize) {
			bytes_read = buffersize;
		}
		const responseChunk = new Uint8Array(connection.xhr.response, connection.resultbufferpointer, bytes_read);
		// @ts-ignore
		writeArrayToMemory(responseChunk, buffer);
		connection.resultbufferpointer += bytes_read;
		return bytes_read;
	},

	emscriptenhttpfree: function (connectionNo) {
		delete emscriptenhttpconnections[connectionNo];
	},
});
