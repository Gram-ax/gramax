const DATA_ELEMENT_ID_ATTRIBUTE = "data-qa";

export default function el(elementId: string) {
	return `[${DATA_ELEMENT_ID_ATTRIBUTE}="${elementId}"]`;
}
