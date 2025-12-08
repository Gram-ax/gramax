/**
 *
 * REFERENCE: https://github.com/petersalomonsen/wasm-git
 *
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ptr2bytes, ptr2str, str2ptr } from "./utils";

self.ptr2str = ptr2str;
self.ptr2bytes = ptr2bytes;
self.str2ptr = str2ptr;

self.emscriptenhttpconnections = {};

const broadcast = new BroadcastChannel("pthreads-broadcast");

const setLastHttpError = async (status: number, body: string) => {
	const fn = Module["_set_last_http_error"];
	const [bodyLen, bodyPtr] = await str2ptr(body);
	await fn(status, bodyPtr, bodyLen);
};

const decoder = new TextDecoder();

const trySetLastHttpError = async (status: number, body: Uint8Array, url?: string) => {
	if (status >= 200 && status < 300) return;

	try {
		// limit body size to 4096 bytes
		if (body.length > 4096) body = body.slice(0, 4096);
		let bodyStr = decoder.decode(body);

		if (status === 0 && bodyStr === "") {
			status = 999;
			const domain = url ? new URL(url).hostname : "";
			bodyStr = `Failed to send request to '${url}': domain '${domain}' unreachable or CORS headers incorrect`;
		}

		await setLastHttpError(status, bodyStr);
	} catch (err) {
		console.error("failed to set last http error", err);
	}
};

broadcast.addEventListener("message", (ev) => {
	if (ev.data.type === "cancel") {
		if (self.cancelToken === ev.data.id && Date.now() - ev.data.date < 1000) {
			Object.values(self.emscriptenhttpconnections).forEach((connection) => {
				connection?.abortController?.abort();
			});
		}
	}
});

const getStore = (key: number) => {
	self.wasm = { wasmMemory: Module.HEAPU8, _rfree: Module._rfree, _ralloc: Module._ralloc };
	const ptr = Module["_get_store"](key);
	const str = ptr2str(ptr);
	return str?.buf;
};

Object.assign(Module, {
	emscriptenhttpconnect: async function (url, buffersize, method, headers) {
		const result = new Promise((resolve) => {
			const connId = Date.now() >> 10;

			if (!method) method = "GET";

			const proxy = getStore(1);
			const token = getStore(2);
			const gitServerUsername = getStore(3) || "git";
			const protocol = getStore(4);

			const xhr = new XMLHttpRequest();
			const abortController = new AbortController();
			url = proxy && proxy !== "null" ? proxy + url.replace(/https?:\/\//, `/`) : url;
			xhr.open(method, url, true);
			xhr.responseType = "arraybuffer";
			xhr.withCredentials = true;
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
						type: "remote-progress",
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
				xhr.onload = async function (load) {
					await trySetLastHttpError(xhr.status, xhr.response);
					resolve(connId);
				};
				xhr.onerror = async function (err) {
					await trySetLastHttpError(xhr.status, xhr.response, url);
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
				connection.xhr.onload = async function (load) {
					await trySetLastHttpError(connection.xhr.status, connection.xhr.response);
					resolve(handleResponse(buffer, buffersize));
				};
				connection.xhr.onabort = function () {
					resolve(-999);
				};
				connection.xhr.onerror = function (err) {
					trySetLastHttpError(connection.xhr.status, connection.xhr.response);
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
