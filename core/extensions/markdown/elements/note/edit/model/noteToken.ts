import getNoteAttrs from "@ext/markdown/elements/note/logic/getNoteAttrs";

const noteToken = {
	block: "note",
	getAttrs: (tok) => {
		return getNoteAttrs(tok.attrs);
	},
};

export default noteToken;
