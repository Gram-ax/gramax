import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import initArticleResource from "@ext/markdown/elementsUtils/AtricleResource/initArticleResource";
import { EditorView } from "prosemirror-view";
import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import { NodeSelection } from "@tiptap/pm/state";

const createImages = async (
	files: File[],
	view: EditorView,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
) => {
	files = files.filter((f) => f);
	if (!files.length) return;

	for (const file of files) {
		if (!file.type.startsWith("image")) continue;
		const newName = await initArticleResource(
			articleProps,
			apiUrlCreator,
			Buffer.from(await file.arrayBuffer()),
			file.type.slice("image/".length),
		);

		const { $from } = view.state.selection;
		const tr = view.state.tr;
		if ($from.parent.type.name === "doc" && $from.nodeAfter?.type?.name === "image")
			return view.dispatch(view.state.tr.setNodeAttribute($from.pos, "src", newName));

		const node = view.state.schema.nodes.image.create({ src: newName });
		tr.replaceSelectionWith(node);
		if ($from.parentOffset === 0 && $from.parent.isTextblock)
			tr.setSelection(NodeSelection.create(tr.doc, $from.pos - 1));
		else tr.setSelection(NodeSelection.create(tr.doc, $from.pos + 1));

		view.dispatch(tr);
	}
};

export default createImages;
