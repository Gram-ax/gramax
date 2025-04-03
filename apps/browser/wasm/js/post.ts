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

self.emscriptenhttpconnections = {};

const broadcast = new BroadcastChannel("pthreads-broadcast");

broadcast.addEventListener("message", (ev) => {
	if (ev.data.type === "cancel-clone") {
		if (self.cancelToken === ev.data.id && Date.now() - ev.data.date < 1000) {
			Object.values(self.emscriptenhttpconnections).forEach((connection) => {
				connection?.abortController?.abort();
			});
		}
	}
});

Object.assign(Module, {
	emscriptenhttpconnect: async function (url, buffersize, method, headers) {
		const result = new Promise((resolve) => {
			const connId = Date.now() >> 10;

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
			const abortController = new AbortController();

			xhr.open(method, proxy && proxy !== "null" ? proxy + url.replace(/https?:\/\//, `/`) : url, true);
			xhr.responseType = "arraybuffer";
			if (token) xhr.setRequestHeader("x-private-token", token);
			if (gitServerUsername) xhr.setRequestHeader("x-git-username", gitServerUsername);
			if (protocol) xhr.setRequestHeader("x-protocol", protocol);

			self.emscriptenhttpconnections[connId] = {
				xhr: xhr,
				abortController: abortController,
				resultbufferpointer: 0,
				buffersize: buffersize,
			};

			if (headers) Object.keys(headers).forEach((header) => xhr.setRequestHeader(header, headers[header]));

			let lastProgressTime = Date.now();
			let speed = 0;
			let lastProgress = 0;

			xhr.onprogress = (ev) => {
				const now = Date.now();
				if (now - lastProgressTime > 1000) {
					speed = ev.loaded - lastProgress;
					lastProgress = ev.loaded;
					lastProgressTime = now;

					self.postMessage({
						type: "clone-progress",
						progress: {
							type: "download",
							data: {
								id: self.cancelToken,
								bytes: ev.loaded,
								downloadSpeedBytes: speed,
							},
						},
					});
				}
			};

			abortController.signal.addEventListener("abort", () => {
				xhr.abort();
			});

			if (method === "GET") {
				xhr.onload = function () {
					resolve(connId);
				};
				xhr.onerror = function () {
					resolve(connId);
				};
				xhr.onabort = function () {
					resolve(connId);
				};
				xhr.send();
			} else {
				resolve(connId);
			}
		});
		return result;
	},
	emscriptenhttpwrite: function (connectionNo, buffer, length) {
		const connection = self.emscriptenhttpconnections[connectionNo];
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
		function handleResponse(buffer, buffersize) {
			const connection = self.emscriptenhttpconnections[connectionNo];
			let bytes_read = connection.xhr.response.byteLength - connection.resultbufferpointer;
			if (bytes_read > buffersize) {
				bytes_read = buffersize;
			}
			const responseChunk = new Uint8Array(connection.xhr.response, connection.resultbufferpointer, bytes_read);
			writeArrayToMemory(responseChunk, buffer);
			connection.resultbufferpointer += bytes_read;
			return bytes_read;
		}

		const result = new Promise((resolve) => {
			const connection = self.emscriptenhttpconnections[connectionNo];
			if (connection.content) {
				connection.xhr.onload = function () {
					resolve(handleResponse(buffer, buffersize));
				};
				connection.xhr.onabort = function () {
					resolve(-1);
				};
				connection.xhr.send(connection.content.buffer);
				connection.content = null;
			} else {
				resolve(handleResponse(buffer, buffersize));
			}
		});

		return result;
	},
	emscriptenhttpfree: function (connectionNo) {
		delete self.emscriptenhttpconnections[connectionNo];
	},
});
