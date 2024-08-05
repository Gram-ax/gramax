import { MockedAPIEndpoint } from "storybook/data/mock";
import { mergeSyncData } from "storybook/stories/extensions/Catalog/Git/BranchActions/mergeApi";

const syncApiData = [
	{
		path: "/api/storage/sync",
		delay: 2000,
		response: mergeSyncData,
		// errorMessage: "sync error",
	},
	{
		path: "/api/storage/getSyncCount",
		delay: 1000,
		response: { pull: 3, push: 2 },
	},
] as MockedAPIEndpoint[];

export default syncApiData;
