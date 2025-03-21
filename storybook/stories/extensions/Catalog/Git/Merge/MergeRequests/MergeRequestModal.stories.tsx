import { Meta, StoryObj } from "@storybook/react";
import mock from "storybook/data/mock";
import mergeRequestApi from "storybook/stories/extensions/Catalog/Git/Merge/MergeRequests/mergeRequestApi";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";
import CreateMergeRequestModalSrc from "../../../../../../../core/extensions/git/actions/Branch/components/MergeRequest/CreateMergeRequest";

const meta: Meta<{ useGesUsersSelect: boolean }> = {
	title: "gx/extensions/Catalog/Git/Merge/MergeRequests/CreateMergeRequestModal",
	decorators: [BlockDecorator],
	args: {
		useGesUsersSelect: false,
	},
	parameters: {
		msw: mock([...mergeRequestApi]),
	},
};
export default meta;

export const CreateMergeRequestModal: StoryObj<{ useGesUsersSelect: boolean }> = {
	render: (props) => (
		<CreateMergeRequestModalSrc
			useGesUsersSelect={props.useGesUsersSelect}
			sourceBranchRef="develop"
			targetBranchRef="master"
			onSubmit={(data) => {
				alert(JSON.stringify(data, null, 2));
			}}
		/>
	),
};
