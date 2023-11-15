import IconSource from "@components/Atoms/Icon";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import InlineDecorator from "../../styles/decorators/InlineDecorator";

export default {
	title: "DocReader/Atoms/Icon",
	args: { code: "text" },
	decorators: [InlineDecorator],
} as ComponentMeta<typeof IconSource>;

export const Icon: ComponentStory<typeof IconSource> = (args) => <IconSource {...args} />;
