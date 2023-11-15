import { ComponentMeta } from "@storybook/react";
import UserSrc from "../../../core/extensions/security/components/User/User";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

export default {
	title: "DocReader/Layouts/UserLayout",
	decorators: [
		InlineDecorator,
		(S) => (
			<div style={{ maxWidth: "400px" }}>
				<S />
			</div>
		),
	],
	args: {
		name: "Test Name",
	},
} as ComponentMeta<typeof UserLayout>;

export const UserLayout = (args: { name: string }) => {
	return (
		<div>
			<UserSrc date={new Date().toJSON()} {...args} />
		</div>
	);
};
