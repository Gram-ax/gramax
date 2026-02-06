import assets from "./assets/index";
import create from "./create";
import edit from "./edit";
import getUninitializedCatalogList from "./getUninitializedCatalogList";
import remove from "./remove";
import setDefaultPath from "./setDefaultPath";
import _switch from "./switch";

export default {
	switch: _switch,
	create,
	remove,
	edit,
	setDefaultPath,
	assets,
	getUninitializedCatalogList,
};
