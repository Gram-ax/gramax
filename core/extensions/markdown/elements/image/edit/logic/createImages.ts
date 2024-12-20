import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import initArticleResource from "@ext/markdown/elementsUtils/AtricleResource/initArticleResource";
import { EditorView } from "prosemirror-view";
import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import { NodeSelection } from "@tiptap/pm/state";
import { OnLoadResource } from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import FetchService from "@core-ui/ApiServices/FetchService";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";

const createImages = async (
	files: File[],
	view: EditorView,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
	onLoadResource: OnLoadResource,
) => {
	files = files.filter((f) => f);
	if (!files.length) return;

	for (const file of files) {
		if (!file.type.startsWith("image")) continue;
		const newName = await initArticleResource(
			articleProps,
			apiUrlCreator,
			onLoadResource,
			Buffer.from(await file.arrayBuffer()),
			file.type.slice("image/".length),
		);

		const { $from } = view.state.selection;
		const attributes: Record<string, any> = { src: newName };

		const urlToImage = URL.createObjectURL(file);
		const newSize = await getNaturalSize(urlToImage);
		URL.revokeObjectURL(urlToImage);

		if (newSize) {
			attributes.width = newSize.width + "px";
			attributes.height = newSize.height + "px";
		}

		const tr = view.state.tr;
		if ($from.parent.type.name === "doc" && $from.nodeAfter?.type?.name === "image") {
			const src = $from.nodeAfter.attrs.src;
			await FetchService.fetch(apiUrlCreator.deleteArticleResource(src));
			return view.dispatch(view.state.tr.setNodeAttribute($from.pos, "src", newName));
		}

		const node = view.state.schema.nodes.image.create(attributes);
		tr.replaceSelectionWith(node);
		if ($from.parentOffset === 0 && $from.parent.isTextblock)
			tr.setSelection(NodeSelection.create(tr.doc, $from.pos - 1));
		else tr.setSelection(NodeSelection.create(tr.doc, $from.pos + 1));

		view.dispatch(tr);
	}
};

export default createImages;
