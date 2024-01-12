import { MockedAPIEndpoint } from "storybook/data/mock";
import { files as testedFiles } from "../../MergeConflictHandler/data";

const branchApiErrorData: MockedAPIEndpoint[] = [
	{
		path: "/api/versionControl/mergeConflict/getFiles",
		response: testedFiles,
		delay: 500,
		// errorMessage: "get files to merge error",
	},
	{
		path: "/api/versionControl/branch/get",
		response: { name: "branch" },
		delay: 50,
		// errorMessage: "get branch error",
	},
	{
		path: "/api/versionControl/branch/mergeConflict/resolve",
		delay: 50,
		// errorMessage: "resolve conflicited files error",
	},
	{
		path: "/api/versionControl/branch/mergeConflict/abort",
		delay: 50,
		// errorMessage: "merge abort to merge error",
	},
];

export default branchApiErrorData;
