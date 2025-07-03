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
import diff from "./diff";
import discard from "./discard";
import fileHistory from "./fileHistory";
import fileStatus from "./fileStatus";
import getAllCommitAuthors from "./getAllCommitAuthors";
import abort from "./mergeConflict/abort";
import getMergeData from "./mergeConflict/getMergeData";
import resolve from "./mergeConflict/resolve";
import validateMerge from "./mergeConflict/validateMerge";
import revision from "./revision";

const versionControl = {
	init,
	discard,
	fileStatus,
	fileHistory,
	statuses,
	getAllCommitAuthors,
	addAll,
	revision,
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
	diff,
};

export default versionControl;
