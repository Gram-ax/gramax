import DiffBottomBarSrc from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Meta, StoryObj } from "@storybook/react";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";

type Props = { oldRevision: string; newRevision: string; filePath: string; title: string };

const meta: Meta<Props> = {
	title: "gx/extensions/Catalog/Diff/DiffBottomBar",
	decorators: [
		(Story) => (
			<div style={{ width: "600px" }}>
				<Story />
			</div>
		),
		BlockDecorator,
	],
	args: {
		oldRevision: "from",
		newRevision: "where",
		filePath: "new_article_02.md",
		title: "New Article 02",
	},
};

export default meta;

export const DiffBottomBar: StoryObj<Props> = {
	render: (args) => (
		<DiffBottomBarSrc
			{...args}
			filePath={{
				path: "docs/catalog/new/" + args.filePath,
				oldPath: "docs/comments/" + args.filePath,
				hunks: [
					{ value: "docs/" },
					{ value: "comments", type: FileStatus.delete },
					{ value: "catalog/new", type: FileStatus.new },
					{ value: "/" + args.filePath },
				],
			}}
		/>
	),
};
