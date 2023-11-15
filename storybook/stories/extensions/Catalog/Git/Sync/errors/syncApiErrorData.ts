import ApiData from "../../../../../../logic/api/model/ApiData";
import { files as testedFiles } from "../../MergeConflictHandler/data";

const syncApiErrorData: ApiData[] = [
	{
		path: "/api/versionControl/mergeConflict/getFiles",
		response: testedFiles,
		delay: 500,
		// errorMessage: "get files to merge error",
	},
	{
		path: "/api/versionControl/branch/get",
		response: { name: "branch" },
		delay: 500,
		// errorMessage: "get branch error",
	},
	{
		path: "/api/storage/pull/mergeConflict/resolve",
		delay: 50,
		// errorMessage: "resolve conflicited files error",
	},
	{
		path: "/api/storage/pull/mergeConflict/abort",
		delay: 50,
		// errorMessage: "merge abort to merge error",
	},
];

export default syncApiErrorData;
