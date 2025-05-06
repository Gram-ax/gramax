function alertToken() {
	return {
		block: "alert",
		getAttrs: (tok) => {
			return {
				type: tok?.attrGet ? tok.attrGet("type") : tok.attrs.type,
				title: tok?.attrGet ? tok.attrGet("title") || null : tok.attrs.title,
			};
		},
	};
}

export default alertToken;
