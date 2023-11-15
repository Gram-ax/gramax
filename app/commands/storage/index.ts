import clone from "./clone";
import getCloneProgress from "./getCloneProgress";
import getUrl from "./getUrl";
import publish from "./publish";
import index from "./pull";
import abort from "./pull/mergeConflict/abort";
import resolve from "./pull/mergeConflict/resolve";
import removeSourceData from "./removeSourceData";
import setSourceData from "./setSourceData";

const storage = {
	pull: {
		index,
		mergeConflict: {
			abort,
			resolve,
		},
	},
	clone,
	getUrl,
	publish,
	setSourceData,
	getCloneProgress,
	removeSourceData,
};

export default storage;
