import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const getIconColor = (noteType: NoteType) => {
	switch (noteType) {
		case NoteType.quote:
			return "currentColor";
		case NoteType.lab:
			return "var(--color-purple-700)";
		case NoteType.tip:
			return "hsl(var(--status-success))";
		case NoteType.note:
			return "hsl(var(--status-warning))";
		case NoteType.info:
			return "hsl(var(--status-info))";
		case NoteType.danger:
			return "hsl(var(--status-error))";
		default:
			return "currentColor";
	}
};

export default getIconColor;
