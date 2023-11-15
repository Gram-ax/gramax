import Icon from "@components/Atoms/Icon";
import BarLayout from "@components/Layouts/BarLayout";
import { ComponentMeta } from "@storybook/react";

export default {
	title: "DocReader/Layouts/Bar",
	component: BarLayout,
	args: {
		height: 64,
		gap: 0,
	},
	decorators: [
		(Story) => {
			return (
				<div style={{ background: "lightblue" }}>
					<Story />
				</div>
			);
		},
	],
} as ComponentMeta<typeof BarLayout>;

export const Bar = ({ height, gap }: { height: number; gap: number }) => {
	return (
		<BarLayout height={height} gap={gap}>
			<>
				<Icon code="git" />
				<Icon code="git" />
				<Icon code="git" />
			</>
		</BarLayout>
	);
};
