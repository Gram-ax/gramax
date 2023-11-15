function getChildTextId(text: string): string {
	return text.toLowerCase().split(" ").join("-");
}

export default getChildTextId;
