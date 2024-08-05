import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { MockedAPIEndpoint } from "../../../../../data/mock";
import { files as testMergeFiles } from "../MergeConflictHandler/data";

export const mergeBranchData = {
	ok: false,
	mergeFiles: testMergeFiles,
	reverseMerge: true,
	caller: MergeConflictCaller.Branch,
} as MergeData;

export const mergeSyncData = {
	ok: false,
	mergeFiles: testMergeFiles,
	reverseMerge: true,
	caller: MergeConflictCaller.Sync,
} as MergeData;

const mergeApi = [
	{
		path: "/api/versionControl/branch/mergeInto",
		delay: 1000,
		response: mergeBranchData,
		// errorMessage: "mergeInto error",
	},
	{
		path: "/api/versionControl/mergeConflict/abort",
		delay: 1000,
		// errorMessage: "abort error",
	},
	{
		path: "/api/versionControl/mergeConflict/resolve",
		delay: 1000,
		// errorMessage: "resolve error",
	},
	{
		path: "/api/versionControl/mergeConflict/getFiles",
		delay: 1000,
		response: mergeBranchData,
		// errorMessage: "getFiles error",
	},
] as MockedAPIEndpoint[];

export default mergeApi;
