import IoError from "@core/FileProvider/DiskFileProvider/DFPIOError";

let callbackId = 0;
const callbacks = {};

export const callFSWasm = async <O>(command: string, args?: any): Promise<O> => {
	const promise = new Promise((resolve, reject) => {
		callbacks[++callbackId] = {
			resolve,
			reject,
		};
	});
	(window as any).wasm.postMessage({
		type: "fs-call",
		command,
		args,
		callbackId,
	});
	return await promise as O;
};

export const onFSWasmCallback = (ev) => {
	if (!(ev.data.type == "fs-call" && ev.data.callbackId)) return;
	const promise = callbacks[ev.data.callbackId];
	delete callbacks[ev.data.callbackId];
  const res = ev.data.res;
  if (!ev.data.ok) return promise.reject(new IoError(res, res.message));
	promise.resolve(ev.data.res);
};
