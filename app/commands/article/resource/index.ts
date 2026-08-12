import createFromPath from "./createFromPath";
import get from "./get";
import getByPath from "./getByPath";
import getPath from "./getPath";
import getPathByCatalogPath from "./getPathByCatalogPath";
import getAllRefFiles from "./openApi/getAllRefFiles";
import removeResource from "./remove";
import set from "./set";

export default {
	get,
	set,
	getByPath,
	createFromPath,
	removeResource,
	getPath,
	getPathByCatalogPath,

	openapi: {
		getAllRefFiles,
	},
};
