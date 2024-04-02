import { alloc, ptr2bytes, ptr2str, str2ptr } from "../../../apps/browser/wasm/js/utils";

const w = self as any;

const decoder = new TextDecoder();

const JSON_OPEN_PAREN_BYTE = 123;
const RAW_BYTES_COMMANDS = ["read_file"];

export const callInternal = async <O>(command: string, args?: any): Promise<O> => {
	// const ptr =  str2ptr(JSON.stringify(args));
	let ptr = [0, 0];
	if (command == "write_file") {
		const buf = new Uint8Array(args.content as Array<number>);
		ptr = await str2ptr(
			JSON.stringify({
				path: args.path,
				contentLen: buf.byteLength,
				contentPtr: await alloc(buf),
			}),
		);
	} else {
		ptr = await str2ptr(JSON.stringify(args));
	}

	try {
		let r_ptr = await w.wasm["_" + command](...ptr);
		if (typeof w.wasm.Asyncify == "object" && w.wasm.Asyncify.currData) r_ptr = await w.wasm.Asyncify.whenDone();

		let str_res: string;
		if (RAW_BYTES_COMMANDS.includes(command)) {
			return ptr2bytes(r_ptr) as O;
		} else {
			str_res = ptr2str(r_ptr);
		}

		const res = str_res && JSON.parse(str_res);
		if (res?.message && res?.name) throw res;
		return res;
	} catch (err) {
		console.error(`fs-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(err);
		return typeof err == "string" ? JSON.parse(err) : err;
	}
};

export const callFS = callInternal;
