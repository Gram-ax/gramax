import statuses from "@app/commands/versionControl/statuses";
import init from "../storage/init";
import addAll from "./addAll";
import abortCheckoutState from "./branch/abortCheckoutState";
import checkout from "./branch/checkout";
import create from "./branch/create";
import deleteBranch from "./branch/delete";
import get from "./branch/get";
import getBranchToCheckout from "./branch/getBranchToCheckout";
import mergeInto from "./branch/mergeInto";
import reset from "./branch/reset";
import diffTree from "./diffTree";
import discard from "./discard";
import fileHistory from "./fileHistory";
import fileStatus from "./fileStatus";
import getAllCommitAuthors from "./getAllCommitAuthors";
import abort from "./mergeConflict/abort";
import getMergeData from "./mergeConflict/getMergeData";
import resolve from "./mergeConflict/resolve";
import validateMerge from "./mergeConflict/validateMerge";

const versionControl = {
	init,
	discard,
	diffTree,
	fileStatus,
	fileHistory,
	statuses,
	getAllCommitAuthors,
	addAll,
	mergeConflict: {
		getMergeData,
		abort,
		resolve,
		validateMerge,
	},
	branch: {
		getBranchToCheckout,
		abortCheckoutState,
		mergeInto,
		checkout,
		create,
		deleteBranch,
		reset,
		get,
	},
};

export default versionControl;
