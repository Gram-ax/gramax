import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Editor } from "@tiptap/core";
import { ArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import Language from "../../../../../localization/core/model/Language";
import initArticleResource from "../../../../elementsUtils/AtricleResource/initArticleResource";
import initDrawioDiagram from "./initDrawioDiagram";

const createDrawio = async (
	editor: Editor,
	articleProps: ArticleProps,
	apiUrlCreator: ApiUrlCreator,
	lang: Language,
) => {
	const newName = await initArticleResource(editor, articleProps, apiUrlCreator, lang, initDrawioDiagram, "svg");
	if (!newName) return;

	editor.chain().setDrawio({ src: newName }).run();
};

export default createDrawio;
