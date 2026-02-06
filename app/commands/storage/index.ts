import getAllSyncableWorkspaces from "@app/commands/storage/getAllSyncableWorkspaces";
import getAllSyncCount from "@app/commands/storage/getAllSyncCount";
import getSourceDataUsage from "@app/commands/storage/getSourceDataUsage";
import getUnsupportedElements from "@app/commands/storage/import/getUnsupportedElements";
import sourceData from "@app/commands/storage/sourceData";
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
import resetFileLock from "./resetFileLock";
import setSourceInvalidState from "./setSourceState";
import startClone from "./startClone";
import startRecover from "./startRecover";
import sync from "./sync";

const storage = {
	import: { getUnsupportedElements },
	sourceData,
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
	getAllSyncableWorkspaces,
	getCloneProgress,
	getSourceDataUsage,
	removeSourceData,
	removeCloneCatalog,
	setSourceInvalidState,
	startRecover,
	resetFileLock,
};

export default storage;
