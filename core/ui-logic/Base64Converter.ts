const srcPrefix = "data:image/svg+xml;base64,";

export const DataImageToBase64 = (dataImage: string) => {
	return dataImage.substring(srcPrefix.length);
};

export const isDataImage = (dataImage: string) => {
	if (!dataImage || typeof dataImage !== "string") return false;
	return dataImage.includes(srcPrefix);
};

export const Base64ToDataImage = (base64: string) => {
	return srcPrefix + base64;
};
