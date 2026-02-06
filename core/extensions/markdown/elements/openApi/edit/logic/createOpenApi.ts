import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import { Editor } from "@tiptap/core";
import OpenApiData from "./OpenApiData";

const createOpenApi = async (
	editor: Editor,
	articleProps: ClientArticleProps,
	resourceService: ResourceServiceType,
) => {
	const name = `${articleProps.fileName}.yaml`;
	const newName = await resourceService.setResource(name, OpenApiData);
	if (!newName) return;
	editor.chain().setOpenApi({ src: newName }).run();
};

export default createOpenApi;
