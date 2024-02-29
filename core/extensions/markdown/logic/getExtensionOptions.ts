function getExtensionOptions({ schema, name, withAttributes = true }) {
	const { attrs, ...rest } = schema;

	return {
		...rest,
		name: name,
		...(attrs && withAttributes ? { addAttributes: () => attrs } : {}),
	};
}

export default getExtensionOptions;
