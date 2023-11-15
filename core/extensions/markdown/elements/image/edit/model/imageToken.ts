function imageToken() {
	return {
		node: "image",
		getAttrs: (tok) => ({
			src: tok.attrGet("src"),
			title: tok.attrGet("title") || null,
			alt: (tok.children[0] && tok.children[0].content) || null,
		}),
	};
}

export default imageToken;
