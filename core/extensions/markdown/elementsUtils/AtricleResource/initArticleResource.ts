import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import fileNameUtils from "@core-ui/fileNameUtils";
import { ClientArticleProps } from "../../../../logic/SitePresenter/SitePresenter";
import getArticleFileBrotherNames from "./getAtricleResourceNames";
import { OnLoadResource } from "@ext/markdown/elements/copyArticles/onLoadResourceService";

const initArticleResource = async (
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
	onLoadResource: OnLoadResource,
	file: string | Buffer,
	extension: string,
	name?: string,
) => {
	const names = await getArticleFileBrotherNames(apiUrlCreator);
	const newName = fileNameUtils.getNewName(names, name ?? articleProps.fileName, extension);
	const res = await FetchService.fetch(apiUrlCreator.setArticleResource(newName), file, MimeTypes.text);
	if (!res.ok) return;
	onLoadResource.update(newName, typeof file == "string" ? Buffer.from(file) : file);
	names.push(newName);
	return newName;
};

export default initArticleResource;
