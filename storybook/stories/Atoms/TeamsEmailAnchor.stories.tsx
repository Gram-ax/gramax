import TeamsEmailAnchorSource from "@components/Atoms/TeamsEmailAnchor";
import { ComponentMeta } from "@storybook/react";

export default {
	title: "DocReader/Atoms/TeamsEmailAnchor",
	component: TeamsEmailAnchorSource,
	decorators: [
		(Story) => {
			return (
				<div style={{ margin: "2rem" }}>
					<Story />
				</div>
			);
		},
	],
	args: {
		email: "testEmail@ics-it.ru",
		userName: "Test Text",
		hasUserName: true,
	},
} as ComponentMeta<typeof TeamsEmailAnchorSource>;

export const TeamsEmailAnchor = ({
	hasUserName,
	email,
	userName,
}: {
	hasUserName: boolean;
	email: string;
	userName: string;
}) => {
	return <TeamsEmailAnchorSource email={email} userName={hasUserName ? userName : null} />;
};
