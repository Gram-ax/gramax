import listIsTight from "../../logic/listIsTight";

const bullet_list = {
	block: "bullet_list",
	getAttrs: (_, tokens, i) => ({ tight: listIsTight(tokens, i) }),
};

export default bullet_list;
