// Next already decodes most segments; fallback avoids URIError on stray % sequences
const safeDecode = (value?: string) => {
	if (!value) return "";
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};

export default safeDecode;
