import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import initArticleResource from "@ext/markdown/elementsUtils/AtricleResource/initArticleResource";
import { EditorView } from "prosemirror-view";
import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";

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

		const node = view.state.schema.nodes.image.create({ src: newName });
		const transaction = view.state.tr.replaceSelectionWith(node);
		view.dispatch(transaction);
	}
};

export default createImages;
