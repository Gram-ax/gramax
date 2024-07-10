import init from "../storage/init";
import checkout from "./branch/checkout";
import create from "./branch/create";
import get from "./branch/get";
import mergeInto from "./branch/mergeInto";
import reset from "./branch/reset";
import diffItems from "./diffItems";
import discard from "./discard";
import fileHistory from "./fileHistory";
import fileStatus from "./fileStatus";
import abort from "./mergeConflict/abort";
import getFiles from "./mergeConflict/getFiles";
import resolve from "./mergeConflict/resolve";

const versionControl = {
	init,
	discard,
	diffItems,
	fileStatus,
	fileHistory,
	mergeConflict: {
		getFiles,
		abort,
		resolve,
	},
	branch: {
		mergeInto,
		checkout,
		create,
		reset,
		get,
	},
};

export default versionControl;
