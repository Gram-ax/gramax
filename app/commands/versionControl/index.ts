import init from "../storage/init";
import checkout from "./branch/checkout";
import create from "./branch/create";
import get from "./branch/get";
import abort from "./branch/mergeConflict/abort";
import resolve from "./branch/mergeConflict/resolve";
import mergeInto from "./branch/mergeInto";
import reset from "./branch/reset";
import diffItems from "./diffItems";
import discard from "./discard";
import fileHistory from "./fileHistory";
import fileStatus from "./fileStatus";
import getFiles from "./mergeConflict/getFiles";

const versionControl = {
	init,
	discard,
	diffItems,
	fileStatus,
	fileHistory,
	mergeConflict: {
		getFiles,
	},
	branch: {
		mergeConflict: {
			abort,
			resolve,
		},
		mergeInto,
		checkout,
		create,
		reset,
		get,
	},
};

export default versionControl;
