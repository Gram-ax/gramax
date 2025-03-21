import { MockedAPIEndpoint } from "storybook/data/mock";

const mergeRequestApi = [
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
	{
		path: "https://test-ges-url.com/sso/connectors/ldap/enabled",
		delay: 200,
	},
] as MockedAPIEndpoint[];

export default mergeRequestApi;
