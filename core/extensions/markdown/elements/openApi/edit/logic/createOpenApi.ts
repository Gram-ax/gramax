import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import initArticleResource from "@ext/markdown/elementsUtils/AtricleResource/initArticleResource";
import { Editor } from "@tiptap/core";
import OpenApiData from "./OpenApiData";
import { OnLoadResource } from "@ext/markdown/elements/copyArticles/onLoadResourceService";

const createOpenApi = async (
	editor: Editor,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
	onLoadResource: OnLoadResource,
) => {
	const extension = "yaml";
	const newName = await initArticleResource(articleProps, apiUrlCreator, onLoadResource, OpenApiData, extension);
	if (!newName) return;
	editor.chain().setOpenApi({ src: newName }).run();
};

export default createOpenApi;
