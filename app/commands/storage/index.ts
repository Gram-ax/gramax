import getUnsupportedElements from "@app/commands/storage/import/getUnsupportedElements";
import getAllSyncCount from "@app/commands/storage/getAllSyncCount";
import canPull from "./canPull";
import fetchCmd from "./fetch";
import getCloneProgress from "./getCloneProgress";
import getSyncCount from "./getSyncCount";
import getUrl from "./getUrl";
import haveToPull from "./haveToPull";
import publish from "./publish";
import removeCloneCatalog from "./removeCloneCatalog";
import removeSourceData from "./removeSourceData";
import setSourceData from "./setSourceData";
import startClone from "./startClone";
import sync from "./sync";

const storage = {
	import: { getUnsupportedElements },
	sync,
	fetchCmd,
	startClone,
	haveToPull,
	canPull,
	getUrl,
	publish,
	getSyncCount,
	getAllSyncCount,
	setSourceData,
	getCloneProgress,
	removeSourceData,
	removeCloneCatalog,
};

export default storage;
