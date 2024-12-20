import { Plugin } from "prosemirror-state";
import { TextSelection } from "@tiptap/pm/state";
import isVideoSupported from "@ext/markdown/elements/video/logic/isVideoSupported";

function isValidURL(url) {
	const urlPattern = /^(https?:\/\/[^\s]+)$/;
	return urlPattern.test(url);
}

function wrapSelectionWithLink(view, url) {
	const { state, dispatch } = view;
	const { from, to, empty } = state.selection;
	if (empty || to - from < 2) return false;

	let tr = state.tr.addMark(from, to, state.schema.marks.link.create({ href: url }));
	tr = tr.setSelection(TextSelection.near(tr.doc.resolve(to)));

	dispatch(tr);
	return true;
}

const addVideo = (editor, url) => {
	return editor.commands.insertContentAt(editor.state.selection.from, {
		type: "video",
		attrs: { path: url },
	});
};

export function linkPastePlugin(editor) {
	return new Plugin({
		props: {
			handlePaste(view, event) {
				const clipboardData = event.clipboardData;
				if (!clipboardData) return false;

				const pastedText = clipboardData.getData("text").trim();
				const isVideo = isVideoSupported(pastedText);
				if (!isValidURL(pastedText) && !isVideo) return false;

				if (isVideo) return addVideo(editor, pastedText);
				if (wrapSelectionWithLink(view, pastedText)) return editor.commands.toggleMark("link");

				return false;
			},
		},
	});
}
