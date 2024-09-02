import { MockedAPIEndpoint } from "storybook/data/mock";

const data = [
	{
		name: "otherBranch1",
		lastCommitAuthor: "commit-author1",
		isLocal: true,
	},
	{
		name: "otherBranch2",
		lastCommitAuthor: "commit-author2",
		isLocal: false,
	},
	{
		name: "otherBranch3",
		lastCommitAuthor: "commit-author3",
		isLocal: true,
	},
	{
		name: "otherBranch4",
		lastCommitAuthor: "commit-author4",
		isLocal: true,
	},
	{
		name: "otherBranch5",
		lastCommitAuthor: "commit-author5",
		isLocal: false,
	},
	{
		name: "otherBranch6",
		lastCommitAuthor: "commit-author6",
		isLocal: true,
	},
	{
		name: "otherBranch7",
		lastCommitAuthor: "commit-author7",
		isLocal: true,
	},
	{
		name: "otherBranch8",
		lastCommitAuthor: "commit-author8",
		isLocal: false,
	},
	{
		name: "otherBranch9",
		lastCommitAuthor: "commit-author9",
		isLocal: true,
	},
];

const checkoutApi = [
	{
		path: "/api/versionControl/branch/checkout",
		delay: 1000,
		// errorMessage: "checkout error",
	},
	{
		path: "/api/versionControl/branch/get",
		delay: 100,
		response: { name: "test_branch" },
		// errorMessage: "checkout error",
	},
	{
		path: "/api/versionControl/branch/getBranchToCheckout",
		delay: 1000,
		response: "test_branch",
		// errorMessage: "getBranchToCheckout error",
	},
	{
		path: "/api/versionControl/branch/abortCheckoutState",
		delay: 1000,
		// errorMessage: "abortCheckoutState error",
	},
	{
		path: "/api/versionControl/branch/create",
		delay: 1000,
		// errorMessage: "create error",
	},
	{
		path: "/api/versionControl/branch/reset",
		delay: 1000,
		response: data,
		// errorMessage: "reset error",
	},
] as MockedAPIEndpoint[];

export default checkoutApi;
