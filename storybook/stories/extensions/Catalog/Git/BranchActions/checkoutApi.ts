import ClientGitBranchData from "@ext/git/actions/Branch/model/ClientGitBranchData";
import { MockedAPIEndpoint } from "storybook/data/mock";

const data: ClientGitBranchData[] = [
	{
		name: "otherBranch1",
		lastCommitAuthor: "commit-author1",
		branchHashSameAsHead: false,
		lastCommitModify: "2024-11-12",
		remoteName: "remote1",
		lastCommitOid: "1234567890",
		mergeRequest: {
			assignees: [{ name: "Test", email: "test@example.com" }],
			author: {
				name: "author",
				email: "author@example.com",
			},
			createdAt: new Date("2024-11-12"),
			targetBranchRef: "master",
			sourceBranchRef: "sourceBranch",
			title: "title",
			updatedAt: new Date("2024-11-12"),
		},
	},
	{
		name: "otherBranch2",
		lastCommitAuthor: "commit-author2",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
		mergeRequest: {
			assignees: [{ name: "Test", email: "test@example.com" }],
			author: {
				name: "author",
				email: "author@example.com",
			},
			createdAt: new Date("2024-11-12"),
			targetBranchRef: "master",
			sourceBranchRef: "sourceBranch",
			title: "title",
			updatedAt: new Date("2024-11-12"),
		},
	},
	{
		name: "otherBranch3",
		lastCommitAuthor: "commit-author3",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
		mergeRequest: {
			assignees: [{ name: "Test", email: "test@example.com" }],
			author: {
				name: "author",
				email: "author@example.com",
			},
			createdAt: new Date("2024-11-12"),
			targetBranchRef: "master",
			sourceBranchRef: "sourceBranch",
			title: "title",
			updatedAt: new Date("2024-11-12"),
		},
	},
	{
		name: "otherBranch4",
		lastCommitAuthor: "commit-author4",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
	},
	{
		name: "otherBranch5",
		lastCommitAuthor: "commit-author5",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
	},
	{
		name: "otherBranch6",
		lastCommitAuthor: "commit-author6",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
	},
	{
		name: "otherBranch7",
		lastCommitAuthor: "commit-author7",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
	},
	{
		name: "otherBranch8",
		lastCommitAuthor: "commit-author8",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
	},
	{
		name: "otherBranch9",
		lastCommitAuthor: "commit-author9",
		lastCommitModify: "2024-11-12",
		branchHashSameAsHead: false,
		remoteName: "remote1",
		lastCommitOid: "1234567890",
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
