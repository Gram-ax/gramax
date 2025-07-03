const inlineImageToken = () => {
	return {
		node: "inlineImage",
		getAttrs: (tok) => {
			return {
				src: tok?.attrGet ? tok.attrGet("src") : tok.attrs.src,
				alt: tok.children ? (tok.children[0] && tok.children[0].content) || null : tok.attrs.alt,
				width: tok?.attrGet ? tok.attrGet("width") : tok.attrs.width,
				height: tok?.attrGet ? tok.attrGet("height") : tok.attrs.height,
			};
		},
	};
};

export default inlineImageToken;
