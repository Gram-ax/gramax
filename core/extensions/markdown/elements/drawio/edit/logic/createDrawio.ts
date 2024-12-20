import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Editor } from "@tiptap/core";
import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import initArticleResource from "../../../../elementsUtils/AtricleResource/initArticleResource";
import initDrawioDiagram from "./initDrawioDiagram";
import { OnLoadResource } from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";

const createDrawio = async (
	editor: Editor,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
	onLoadResource: OnLoadResource,
	diagramContent?: string,
) => {
	const content = diagramContent ?? initDrawioDiagram;
	const newName = await initArticleResource(articleProps, apiUrlCreator, onLoadResource, content, "svg");
	if (!newName) return;

	const newSize = getNaturalSize(content);
	const attributes: { src: string; width?: string; height?: string } = { src: newName };
	if (newSize) {
		attributes.width = newSize.width + "px";
		attributes.height = newSize.height + "px";
	}

	editor.chain().setDrawio(attributes).run();
};

export default createDrawio;
