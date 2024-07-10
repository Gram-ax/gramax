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
	const data = (await promise) as any;
	if (!data.ok) throw new IoError(data.res);
	return data.res;
};

export const onFSWasmCallback = (ev) => {
	if (!(ev.data.type == "fs-call" && ev.data.callbackId)) return;
	const promise = callbacks[ev.data.callbackId];
	delete callbacks[ev.data.callbackId];
	promise.resolve(ev.data);
};
