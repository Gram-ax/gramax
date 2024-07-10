function getExtensionOptions({ schema, name, withAttributes = true, withResource = false }) {
	const { attrs, ...rest } = schema;

	return {
		...rest,
		name: name,
		...(attrs && withAttributes
			? { addAttributes: () => (withResource ? { ...attrs, resource: { defualt: null } } : attrs) }
			: {}),
	};
}

export default getExtensionOptions;
