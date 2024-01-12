import IconSource from "@components/Atoms/Icon";
import { Meta } from "@storybook/react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

export default {
	title: "gx/Atoms/Icon",
	args: { code: "text" },
	decorators: [InlineDecorator],
} as Meta<typeof IconSource>;

export const Icon = (args) => <IconSource {...args} />;
