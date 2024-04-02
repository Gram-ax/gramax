import create from "./create";
import edit from "./edit";
import getArticlesWithSnippet from "./getArticlesWithSnippet";
import getEditData from "./getEditData";
import getListData from "./getListData";
import getRenderData from "./getRenderData";
import remove from "./remove";

const snippet = {
	edit,
	create,
	remove,
	getListData,
	getEditData,
	getRenderData,
	getArticlesWithSnippet,
};

export default snippet;
