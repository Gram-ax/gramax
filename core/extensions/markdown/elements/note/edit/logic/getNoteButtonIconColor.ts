import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const getIconColor = (noteType: NoteType) => {
	switch (noteType) {
		case NoteType.quote:
			return "var(--color-admonition-dropdown-quote)";
		case NoteType.lab:
			return "var(--color-admonition-dropdown-lab)";
		case NoteType.tip:
			return "var(--color-admonition-dropdown-tip)";
		case NoteType.note:
			return "var(--color-admonition-dropdown-note)";
		case NoteType.info:
			return "var(--color-admonition-dropdown-info)";
		case NoteType.danger:
			return "var(--color-admonition-dropdown-danger)";
		default:
			return "var(--color-admonition-hotfixes-br-h)";
	}
};

export default getIconColor;
