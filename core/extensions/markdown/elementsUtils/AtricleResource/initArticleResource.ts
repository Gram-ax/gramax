import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import fileNameUtils from "@core-ui/fileNameUtils";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { ClientArticleProps } from "../../../../logic/SitePresenter/SitePresenter";
import getArticleFileBrotherNames from "./getAtricleResourceNames";

const initArticleResource = async (
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
	file: string | Buffer,
	extension: string,
	name?: string,
) => {
	const names = await getArticleFileBrotherNames(apiUrlCreator);
	const newName = fileNameUtils.getNewName(names, name ?? articleProps.fileName, extension);
	const res = await FetchService.fetch(apiUrlCreator.setArticleResource(newName), file, MimeTypes.text);
	if (!res.ok) return;
	OnLoadResourceService.update(newName, typeof file == "string" ? Buffer.from(file) : file);
	names.push(newName);
	return newName;
};

export default initArticleResource;
