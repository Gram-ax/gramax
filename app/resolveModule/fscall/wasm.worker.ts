import { alloc, str2ptr } from "../../../apps/browser/wasm/js/utils";

const w = self as any;

export const callInternal = async (command: string, args?: any): Promise<number> => {
	let ptr = [0, 0];
	if (command == "write_file") {
		const buf = new Uint8Array(typeof args.content == "string" ? Buffer.from(args.content) : args.content);
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

	return await w.wasm["_" + command](...ptr);
};

export const callFS = callInternal;
