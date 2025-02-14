import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const getBool = (value: string | boolean | undefined): boolean => {
	if (typeof value === "string") return value === "true";
	if (typeof value === "boolean") return value;

	return false;
};

const getNoteAttrs = (attrs: { [key: string]: any }) => {
	const { type, title, collapsed } = attrs;

	attrs.collapsed = getBool(collapsed);
	if (!title && typeof title !== "string") attrs.title = "";
	if (!type || !(type in NoteType)) attrs.type = NoteType.note;

	return attrs;
};

export default getNoteAttrs;
