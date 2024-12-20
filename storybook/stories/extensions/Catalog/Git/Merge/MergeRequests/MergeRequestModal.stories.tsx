import { Meta, StoryObj } from "@storybook/react";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";
import MergeRequestModalSrc from "../../../../../../../core/extensions/git/actions/Branch/components/MergeRequestModal";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Merge/MergeRequests/MergeRequestModal",
	decorators: [BlockDecorator],
};
export default meta;

export const MergeRequestModal: StoryObj = {
	render: () => (
		<MergeRequestModalSrc
			sourceBranchRef="develop"
			targetBranchRef="master"
			onSubmit={(data) => {
				alert(JSON.stringify(data, null, 2));
			}}
		/>
	),
};
