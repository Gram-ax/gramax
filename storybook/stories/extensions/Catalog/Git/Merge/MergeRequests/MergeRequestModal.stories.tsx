import { Meta, StoryObj } from "@storybook/react";
import mock, { MockedAPIEndpoint } from "storybook/data/mock";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";
import CreateMergeRequestModalSrc from "../../../../../../../core/extensions/git/actions/Branch/components/MergeRequest/CreateMergeRequest";

const meta: Meta<{ isEnterprise: boolean }> = {
	title: "gx/extensions/Catalog/Git/Merge/MergeRequests/CreateMergeRequestModal",
	decorators: [BlockDecorator],
	args: {
		isEnterprise: false,
	},
	parameters: {
		msw: mock([
			{
				path: "/api/versionControl/getAllCommitAuthors",
				delay: 1000,
				response: [
					{
						name: "John Doe Git",
						email: "john.doe@example.com",
					},
					{
						name: "Jane Doe Git",
						email: "jane.doe@example.com",
					},
					{
						name: "John Smith Git",
						email: "john.smith@example.com",
					},
				],
			},
			{
				path: "https://test-ges-url.com/sso/connectors/ldap/getUsers",
				delay: 200,
				response: (_, body) => {
					const searchValue = body.emailOrCn;
					if (!searchValue) return [];

					const users = [
						{
							name: "John Doe GES",
							email: "john.doe@example.com",
						},
						{
							name: "Jane Doe GES",
							email: "jane.doe@example.com",
						},
						{
							name: "John Smith GES",
							email: "john.smith@example.com",
						},
					];
					return users.filter(
						(user) =>
							user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
							user.email.toLowerCase().includes(searchValue.toLowerCase()),
					);
				},
			},
		] as MockedAPIEndpoint[]),
	},
};
export default meta;

export const CreateMergeRequestModal: StoryObj<{ isEnterprise: boolean }> = {
	render: (props) => (
		<CreateMergeRequestModalSrc
			isEnterprise={props.isEnterprise}
			sourceBranchRef="develop"
			targetBranchRef="master"
			onSubmit={(data) => {
				alert(JSON.stringify(data, null, 2));
			}}
		/>
	),
};
