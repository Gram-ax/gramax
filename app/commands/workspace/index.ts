import assets from "./assets/index";
import create from "./create";
import edit from "./edit";
import remove from "./remove";
import setDefaultPath from "./setDefaultPath";
import _switch from "./switch";
import getUninitializedCatalogList from "./getUninitializedCatalogList";

export default {
	switch: _switch,
	create,
	remove,
	edit,
	setDefaultPath,
	assets,
	getUninitializedCatalogList,
};
