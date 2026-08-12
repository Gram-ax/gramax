// pdfjs-dist ships ESM using `import.meta`, which jest's CJS runtime cannot parse.
const notSupported = () => {
	throw new Error("pdfjs is mocked under jest; real PDF parsing is not available");
};

export const getDocument = notSupported;
export const Util = { transform: notSupported, applyTransform: notSupported };
export default { getDocument, Util };
