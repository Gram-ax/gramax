import { EditorView } from "prosemirror-view";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { arrayBufferToBase64 } from "@core-ui/Base64Converter";
import fileNameUtils from "@core-ui/fileNameUtils";
import { ArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import Language from "../../../../../localization/core/model/Language";
import useLocalize from "../../../../../localization/useLocalize";
import getAtricleResourceNames from "../../../../elementsUtils/AtricleResource/getAtricleResourceNames";
import { NoteType } from "../../../note/render/component/Note";

const createImages = async (
	files: File[],
	view: EditorView,
	articleProps: ArticleProps,
	apiUrlCreator: ApiUrlCreator,
	language: Language,
) => {
	files = files.filter((f) => f);
	if (!files.length) return;
	const names = await getAtricleResourceNames(apiUrlCreator);

	for (const file of files) {
		if (!file.type.startsWith("image")) return;
		const newName = fileNameUtils.getNewName(names, articleProps.fileName, file.type.slice("image/".length));

		const res = await FetchService.fetch(
			apiUrlCreator.setArticleResource(newName, true),
			arrayBufferToBase64(await file.arrayBuffer()),
			file.type as MimeTypes,
		);

		let node;
		if (res.ok) {
			names.push(newName);
			node = view.state.schema.nodes.image.create({ src: newName });
		} else {
			let text = useLocalize("fileLoadError", language);
			if (res.status == 413) text = useLocalize("fileSizeError", language);

			node = view.state.schema.nodes.note.create(
				{ type: NoteType.danger },
				view.state.schema.nodes.paragraph.create({}, view.state.schema.text(text)),
			);
		}
		const transaction = view.state.tr.replaceSelectionWith(node);
		view.dispatch(transaction);
	}
};

export default createImages;
