import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Editor } from "@tiptap/core";
import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import initArticleResource from "../../../../elementsUtils/AtricleResource/initArticleResource";
import initDrawioDiagram from "./initDrawioDiagram";

const createDrawio = async (editor: Editor, articleProps: ClientArticleProps, apiUrlCreator: ApiUrlCreator) => {
	const newName = await initArticleResource(articleProps, apiUrlCreator, initDrawioDiagram, "svg");
	if (!newName) return;

	editor.chain().setDrawio({ src: newName }).run();
};

export default createDrawio;
