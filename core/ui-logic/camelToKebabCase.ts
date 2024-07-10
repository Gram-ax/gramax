function camelToKebabCase(str: string) {
	return str.replace(/[A-Z]/g, (char, index) => (index ? `-${char.toLowerCase()}` : char.toLowerCase()));
}

export default camelToKebabCase;
