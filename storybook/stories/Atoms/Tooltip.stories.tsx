import TooltipSource from "@components/Atoms/Tooltip";
import { ComponentMeta } from "@storybook/react";
import { Placement } from "tippy.js";

export default {
	title: "DocReader/Atoms/Tooltip",
	decorators: [
		(Story) => {
			return (
				<div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
					<Story />
				</div>
			);
		},
	],
	args: {
		children: "children",
		content: "content",
		distance: 10,
	},
	argTypes: {
		content: { type: "string" },
	},
} as ComponentMeta<typeof Tooltip>;

export const Tooltip = (args: { children: string; content: string; place: Placement; distance: number }) => {
	const { children, ...thisArgs } = args;
	return (
		<TooltipSource {...thisArgs}>
			<span>{children}</span>
		</TooltipSource>
	);
};
