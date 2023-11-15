import { Editor } from "@tiptap/core";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import fileNameUtils from "@core-ui/fileNameUtils";
import { ArticleProps } from "../../../../logic/SitePresenter/SitePresenter";
import Language from "../../../localization/core/model/Language";
import useLocalize from "../../../localization/useLocalize";
import { NoteType } from "../../elements/note/render/component/Note";
import getAtricleResourceNames from "./getAtricleResourceNames";

const initArticleResource = async (
	editor: Editor,
	articleProps: ArticleProps,
	apiUrlCreator: ApiUrlCreator,
	lang: Language,
	file: string,
	extension: string,
	isBase64 = false,
) => {
	const names = await getAtricleResourceNames(apiUrlCreator);
	const newName = fileNameUtils.getNewName(names, articleProps.fileName, extension);
	const res = await FetchService.fetch(apiUrlCreator.setArticleResource(newName, isBase64), file, MimeTypes.text);

	if (res.ok) {
		names.push(newName);
		return newName;
	} else {
		const text = useLocalize("fileLoadError", lang);
		const node = editor.view.state.schema.nodes.note.create(
			{ type: NoteType.danger },
			editor.view.state.schema.nodes.paragraph.create({}, editor.view.state.schema.text(text)),
		);
		const transaction = editor.view.state.tr.replaceSelectionWith(node);
		editor.view.dispatch(transaction);
		return null;
	}
};

export default initArticleResource;
