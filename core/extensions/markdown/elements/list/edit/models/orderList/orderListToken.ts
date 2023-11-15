import listIsTight from "../../logic/listIsTight";

const ordered_list = {
	block: "ordered_list",
	getAttrs: (tok, tokens, i) => ({
		order: +tok.attrGet("start") || 1,
		tight: listIsTight(tokens, i),
	}),
};

export default ordered_list;
