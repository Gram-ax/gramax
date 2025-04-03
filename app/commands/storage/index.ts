import getAllSyncCount from "@app/commands/storage/getAllSyncCount";
import getSourceDataUsage from "@app/commands/storage/getSourceDataUsage";
import getUnsupportedElements from "@app/commands/storage/import/getUnsupportedElements";
import cancelClone from "./cancelClone";
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
import setSourceInvalidState from "./setSourceState";
import startClone from "./startClone";
import sync from "./sync";

const storage = {
	import: { getUnsupportedElements },
	sync,
	fetchCmd,
	startClone,
	cancelClone,
	haveToPull,
	canPull,
	getUrl,
	publish,
	getSyncCount,
	getAllSyncCount,
	setSourceData,
	getCloneProgress,
	getSourceDataUsage,
	removeSourceData,
	removeCloneCatalog,
	setSourceInvalidState,
};

export default storage;
