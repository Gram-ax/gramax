import { DiffEntries as DiffEntriesSrc } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import IndentLineSrc from "@ext/git/core/GitMergeRequest/components/Changes/IndentLine";
import { Meta, StoryObj } from "@storybook/react";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";
import diffTree from "./diffTreeData";

const meta: Meta<{ checkboxes: boolean }> = {
	title: "gx/extensions/Catalog/Navigation/Tabs/DiffEntries",
	decorators: [BlockDecorator],
};
export default meta;

export const DiffEntries: StoryObj<{ checkboxes: boolean }> = {
	render: (props) => (
		<div style={{ width: "500px" }}>
			<DiffEntriesSrc
				renderCommentsCount={false}
				changes={diffTree}
				setArticleDiffView={() => {}}
				onAction={() => {}}
				actionIcon="reply"
				selectFile={props.checkboxes ? () => {} : undefined}
				isFileSelected={props.checkboxes ? () => true : undefined}
			/>
		</div>
	),
	args: {
		checkboxes: true,
	},
};

export const IndentLine: StoryObj<{ level: number; ignoreFirstLine: boolean }> = {
	render: (props) => (
		<div style={{ height: "100px", width: "100px", position: "relative" }}>
			<IndentLineSrc level={props.level} color="red" ignoreFirstLine={props.ignoreFirstLine} />
		</div>
	),
	args: {
		level: 5,
		ignoreFirstLine: false,
	},
};
