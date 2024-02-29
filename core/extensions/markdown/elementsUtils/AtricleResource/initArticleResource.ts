import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import fileNameUtils from "@core-ui/fileNameUtils";
import { ClientArticleProps } from "../../../../logic/SitePresenter/SitePresenter";
import getArticleResourceNames from "./getAtricleResourceNames";

const initArticleResource = async (
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
	file: string,
	extension: string,
	isBase64 = false,
) => {
	const names = await getArticleResourceNames(apiUrlCreator);
	const newName = fileNameUtils.getNewName(names, articleProps.fileName, extension);
	const res = await FetchService.fetch(apiUrlCreator.setArticleResource(newName, isBase64), file, MimeTypes.text);
	if (!res.ok) return;
	names.push(newName);
	return newName;
};

export default initArticleResource;
