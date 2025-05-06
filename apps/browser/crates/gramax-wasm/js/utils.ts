const encoder = new TextEncoder();
const decoder = new TextDecoder();

const w = self as any;

export const alloc = async (buffer: Uint8Array): Promise<number> => {
	const ptr = await w.wasm._ralloc(buffer.byteLength);
	const mem = new Uint8Array(w.wasm.wasmMemory.buffer);
	mem.set(buffer, ptr);
	return ptr;
};

export const str2ptr = async (s: string): Promise<[number, number]> => {
	const s_bytes = encoder.encode(s);
	const s_ptr = await alloc(s_bytes);
	return [s_bytes.byteLength, s_ptr];
};

export const ptr2str = (ptr: number) => {
	const buffer_as_u8 = ptr2bytes(ptr);
	if (buffer_as_u8?.buf.length == 0) return { buf: undefined, ok: buffer_as_u8.ok };
	const buffer_as_utf8 = decoder.decode(buffer_as_u8.buf);
	return { buf: buffer_as_utf8, ok: buffer_as_u8.ok };
};

export const ptr2bytes = (buff_ptr: number) => {
	const mem = new Uint8Array(w.wasm.wasmMemory.buffer);
	const dataView = new DataView(mem.buffer, buff_ptr, 9);
	const len = dataView.getUint32(0, true); // buffer.len
	const ptr = dataView.getUint32(4, true); // buffer.ptr
	const ok = dataView.getUint8(8) !== 1; // buffer.err
	const buf = mem.slice(ptr, ptr + len);
	w.wasm._rfree(ptr, len);
	w.wasm._rfree(buff_ptr, 9);
	return { buf, ok };
};
