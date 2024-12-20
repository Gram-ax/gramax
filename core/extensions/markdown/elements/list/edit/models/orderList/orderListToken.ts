import listIsTight from "../../logic/listIsTight";

const orderedList = {
	block: "orderedList",
	getAttrs: (tok, tokens, i) => ({
		order: +tok.attrGet("start") || 1,
		tight: listIsTight(tokens, i),
	}),
};

export default orderedList;
