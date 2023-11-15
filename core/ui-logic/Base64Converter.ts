const srcPrefix = "data:image/svg+xml;base64,";

export const DataImageToBase64 = (dataImage: string) => {
	return dataImage.substring(srcPrefix.length);
};

export const Base64ToDataImage = (base64: string) => {
	return srcPrefix + base64;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
};
