import TooltipSource from "@components/Atoms/Tooltip";
import { Meta, StoryObj } from "@storybook/react";
import { ComponentProps } from "react";
import CenterDecorator from "storybook/styles/decorators/CenterDecorator";

type Props = { childrenString: string } & ComponentProps<typeof TooltipSource>;

const meta: Meta<Props> = {
	title: "gx/Atoms/Tooltip",
	decorators: [CenterDecorator],
	args: {
		childrenString: "children",
		content: "content",
		distance: 10,
		interactive: false,
	},
	argTypes: {
		content: { type: "string" },
	},
};

export default meta;

export const Tooltip: StoryObj<Props> = {
	render: (props) => {
		const { childrenString, ...thisArgs } = props;
		return (
			<TooltipSource {...thisArgs}>
				<span>{childrenString}</span>
			</TooltipSource>
		);
	},
};
