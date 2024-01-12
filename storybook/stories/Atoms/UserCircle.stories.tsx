import UserCircleSource from "@components/Atoms/UserCircle";
import { ComponentMeta } from "@storybook/react";

export default {
	title: "gx/Atoms/UserCircle",
	args: {
		name: "Test Name (ics-it)",
	},
} as ComponentMeta<typeof UserCircle>;

export const UserCircle = ({ name }: { name: string }) => {
	return <UserCircleSource name={name} />;
};
