import { alloc, ptr2bytes, ptr2str, str2ptr } from "../../../apps/browser/wasm/js/utils";

const w = self as any;
const decoder = new TextDecoder();

const RAW_BYTES_COMMANDS = ["read_file"];

export const callInternal = async <O>(command: string, args?: any): Promise<O> => {
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
		const r_ptr = await w.wasm["_" + command](...ptr);
		if (RAW_BYTES_COMMANDS.includes(command)) {
			const bytes = ptr2bytes(r_ptr);
			if (!bytes.ok) throw decoder.decode(bytes.buf);
			return bytes?.buf as O;
		}

		const str_res = ptr2str(r_ptr);
		if (!str_res.ok) throw str_res?.buf;
		return str_res.buf && JSON.parse(str_res.buf);
	} catch (err) {
		return typeof err == "string" ? JSON.parse(err) : err;
	}
};

export const callFS = callInternal;
