import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { arrayBufferToBase64 } from "@core-ui/Base64Converter";
import fileNameUtils from "@core-ui/fileNameUtils";
import { EditorView } from "prosemirror-view";
import { ArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import getArticleResourceNames from "../../../../elementsUtils/AtricleResource/getAtricleResourceNames";

const createImages = async (
	files: File[],
	view: EditorView,
	articleProps: ArticleProps,
	apiUrlCreator: ApiUrlCreator,
) => {
	files = files.filter((f) => f);
	if (!files.length) return;
	const names = await getArticleResourceNames(apiUrlCreator);

	for (const file of files) {
		if (!file.type.startsWith("image")) return;
		const newName = fileNameUtils.getNewName(names, articleProps.fileName, file.type.slice("image/".length));

		const res = await FetchService.fetch(
			apiUrlCreator.setArticleResource(newName, true),
			arrayBufferToBase64(await file.arrayBuffer()),
			file.type as MimeTypes,
		);

		if (!res.ok) return;
		names.push(newName);
		const node = view.state.schema.nodes.image.create({ src: newName });
		const transaction = view.state.tr.replaceSelectionWith(node);
		view.dispatch(transaction);
	}
};

export default createImages;
