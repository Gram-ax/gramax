import { EditorView } from "prosemirror-view";
import { Selection, Transaction } from "@tiptap/pm/state";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import { Attrs, ResolvedPos } from "@tiptap/pm/model";
import { MAX_INLINE_IMAGE_HEIGHT } from "@ext/markdown/elements/inlineImage/edit/models/node";

const createBlockImage = (view: EditorView, $from: ResolvedPos, attributes: Attrs): Transaction => {
	const tr = view.state.tr;

	const node = view.state.schema.nodes.image.create(attributes);
	tr.replaceSelectionWith(node);
	if ($from.parentOffset === 0 && $from.parent.isTextblock)
		tr.setSelection(Selection.near(tr.doc.resolve($from.pos - 1)));
	else tr.setSelection(Selection.near(tr.doc.resolve($from.pos + 1)));

	return tr;
};

const createInlineImage = (view: EditorView, $from: ResolvedPos, attributes: Attrs): Transaction => {
	const tr = view.state.tr;

	const node = view.state.schema.nodes.inlineImage.create(attributes);
	tr.replaceSelectionWith(node);

	return tr;
};

const createImages = async (
	files: File[],
	view: EditorView,
	fileName: string,
	resourceService: ResourceServiceType,
) => {
	files = files.filter((f) => f);
	if (!files.length) return;

	for (const file of files) {
		if (!file.type.startsWith("image")) continue;

		const { $from, $to } = view.state.selection;
		const attributes: Record<string, any> = { src: "" };

		const urlToImage = URL.createObjectURL(file);
		const newSize = await getNaturalSize(urlToImage);
		URL.revokeObjectURL(urlToImage);

		let isInline = false;

		if ($from.pos === $to.pos && $from.parent.isTextblock && $from.parent.childCount) isInline = true;
		if (newSize) {
			attributes.width = newSize.width + "px";
			attributes.height = newSize.height + "px";

			if (!isInline) isInline = newSize.height <= MAX_INLINE_IMAGE_HEIGHT;
		}

		if (isInline && ($from.parent === view.state.doc.firstChild || $to.parent === view.state.doc.firstChild))
			continue;

		const name = `${fileName}.${file.name.split(".").pop()}`;
		const newName = await resourceService.setResource(name, Buffer.from(await file.arrayBuffer()));
		attributes.src = newName;

		const tr = isInline ? createInlineImage(view, $from, attributes) : createBlockImage(view, $from, attributes);
		view.dispatch(tr);
	}
};

export default createImages;
