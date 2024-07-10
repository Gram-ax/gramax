import getUnsupportedElements from "@app/commands/storage/confluence/getUnsupportedElements";
import getAllSyncCount from "@app/commands/storage/getAllSyncCount";
import canPull from "./canPull";
import clone from "./clone";
import fetchCmd from "./fetch";
import getCloneProgress from "./getCloneProgress";
import getSyncCount from "./getSyncCount";
import getUrl from "./getUrl";
import haveToPull from "./haveToPull";
import publish from "./publish";
import removeSourceData from "./removeSourceData";
import setSourceData from "./setSourceData";
import sync from "./sync";

const storage = {
	confluence: { getUnsupportedElements },
	sync,
	fetchCmd,
	clone,
	haveToPull,
	canPull,
	getUrl,
	publish,
	getSyncCount,
	getAllSyncCount,
	setSourceData,
	getCloneProgress,
	removeSourceData,
};

export default storage;
