function inlinePropertyToken() {
	return {
		node: "inline-property",
		getAttrs: (tok) => {
			return {
				bind: tok.attrs?.bind,
			};
		},
	};
}

export default inlinePropertyToken;
