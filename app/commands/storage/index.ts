import clone from "./clone";
import fetchCmd from "./fetch";
import getCloneProgress from "./getCloneProgress";
import getSyncCount from "./getSyncCount";
import getUrl from "./getUrl";
import haveToPull from "./haveToPull";
import publish from "./publish";
import removeSourceData from "./removeSourceData";
import setSourceData from "./setSourceData";
import index from "./sync";
import abort from "./sync/mergeConflict/abort";
import resolve from "./sync/mergeConflict/resolve";

const storage = {
	sync: {
		index,
		mergeConflict: {
			abort,
			resolve,
		},
	},
	fetchCmd,
	clone,
	haveToPull,
	getUrl,
	publish,
	getSyncCount,
	setSourceData,
	getCloneProgress,
	removeSourceData,
};

export default storage;
