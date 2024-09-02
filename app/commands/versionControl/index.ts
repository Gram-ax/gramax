import init from "../storage/init";
import abortCheckoutState from "./branch/abortCheckoutState";
import checkout from "./branch/checkout";
import create from "./branch/create";
import get from "./branch/get";
import getBranchToCheckout from "./branch/getBranchToCheckout";
import mergeInto from "./branch/mergeInto";
import reset from "./branch/reset";
import diffItems from "./diffItems";
import discard from "./discard";
import fileHistory from "./fileHistory";
import fileStatus from "./fileStatus";
import abort from "./mergeConflict/abort";
import getMergeData from "./mergeConflict/getMergeData";
import resolve from "./mergeConflict/resolve";

const versionControl = {
	init,
	discard,
	diffItems,
	fileStatus,
	fileHistory,
	mergeConflict: {
		getMergeData,
		abort,
		resolve,
	},
	branch: {
		getBranchToCheckout,
		abortCheckoutState,
		mergeInto,
		checkout,
		create,
		reset,
		get,
	},
};

export default versionControl;
