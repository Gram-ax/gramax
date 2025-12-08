import { createDynamicImport } from "./createDynamicImport";

interface Mammoth {
	convertToHtml(input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer }): Promise<{ value: string }>;
}

const mammoth = createDynamicImport<Mammoth>({
	importFunction: () => import("mammoth"),
});

export default mammoth;
