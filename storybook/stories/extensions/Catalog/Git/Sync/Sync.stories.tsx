import SyncLayoutSrc from "@ext/git/actions/Sync/components/SyncLayout";
import { Meta, StoryObj } from "@storybook/react";
import { ComponentProps } from "react";
import mock from "storybook/data/mock";
import mergeApi from "storybook/stories/extensions/Catalog/Git/BranchActions/mergeApi";
import SyncSrc from "../../../../../../core/extensions/git/actions/Sync/components/Sync";
import BlockDecorator from "../../../../../styles/decorators/BlockDecorator";
import syncApiData from "./syncApiData";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Sync",
	decorators: [
		(Story) => (
			<div
				style={{
					background: "black",
					width: "100px",
					height: "25px",
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Story />
			</div>
		),
		BlockDecorator,
	],
	parameters: {
		msw: mock([...syncApiData, ...mergeApi]),
	},
};

export default meta;

export const SyncComponent: StoryObj = {
	render: () => <SyncSrc />,
};

export const SyncLayout: StoryObj<ComponentProps<typeof SyncLayoutSrc>> = {
	args: {
		pullCounter: 1,
		pushCounter: 0,
		syncProccess: false,
	},
	render: (props) => <SyncLayoutSrc {...props} />,
};
