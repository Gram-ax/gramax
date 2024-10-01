import { MockedAPIEndpoint } from "storybook/data/mock";
import { publishApiData } from "storybook/stories/extensions/Catalog/Git/Publish/publishApiData";

const publishApi: MockedAPIEndpoint[] = [
	{
		path: "/api/versionControl/diffItems",
		response: publishApiData,
		delay: 100,
		// errorMessage: "diffItems error",
	},
	{
		path: "/api/storage/publish",
		delay: 100,
		// errorMessage: "publish error",
	},
	{
		path: "/api/versionControl/discard",
		delay: 100,
		// errorMessage: "discard error",
	},
];

export default publishApi;
