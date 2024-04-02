const encoder = new TextEncoder();
const decoder = new TextDecoder();

const w = self as any;

type UnmanagedString = [number, number];

export const alloc = async (buffer: Uint8Array): Promise<number> => {
  const ptr = await w.wasm._ralloc(buffer.byteLength);
  const mem = new Uint8Array(w.wasm.wasmMemory.buffer);
  mem.set(buffer, ptr);
  return ptr;
}

export const str2ptr = async (s: string): Promise<UnmanagedString> => {
	const s_bytes = encoder.encode(s);
	const s_ptr = await alloc(s_bytes);
	return [s_bytes.byteLength, s_ptr];
};

export const ptr2str = (ptr: number): string => {
	const buffer_as_u8 = ptr2bytes(ptr);
	if (buffer_as_u8.length == 0) return;
	const buffer_as_utf8 = decoder.decode(buffer_as_u8);
	return buffer_as_utf8;
};

export const ptr2bytes = (buff_ptr: number): Uint8Array => {
	const mem = new Uint8Array(w.wasm.wasmMemory.buffer);
	const buffer = Buffer.from(mem.slice(buff_ptr, buff_ptr + 8));
	const len = buffer.readUint32LE(0); // buffer.len
	const ptr = buffer.readUInt32LE(4); // buffer.ptr
	const buff = mem.slice(ptr, ptr + len);
	w.wasm._rfree(ptr, len);
	w.wasm._rfree(buff_ptr, 8);
	return buff;
};

export const monitor = async (command: string, args: any, fn: (command, args) => Promise<any>) => {
	const heapBefore = w.wasm.wasmMemory.buffer.byteLength / 1024 / 1024;
	console.log(`heap: ${heapBefore}mb; call ${command} w/ args`, args);
	const res = await fn(command, args);
	const heapAfter = w.wasm.wasmMemory.buffer.byteLength / 1024 / 1024;
	console.log(`heap usage: ${heapAfter}mb; delta: ${heapAfter - heapBefore}mb`);
	return res;
};

w.obj2ptr = (obj: object) => str2ptr(JSON.stringify(obj));
w.ptr2obj = (ptr: number) => JSON.parse(ptr2str(ptr));
