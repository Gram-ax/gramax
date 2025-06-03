function blockPropertyToken() {
	return {
		block: "block-property",
		getAttrs: (tok) => {
			return {
				bind: tok.attrs?.bind,
			};
		},
	};
}

export default blockPropertyToken;
