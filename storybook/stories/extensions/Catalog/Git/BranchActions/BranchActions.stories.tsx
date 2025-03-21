import { Meta, StoryObj } from "@storybook/react";
import mock from "storybook/data/mock";
import BranchActionsSrc from "../../../../../../core/extensions/git/actions/Branch/components/BranchActions";
import BlockDecorator from "../../../../../styles/decorators/InlineDecorator";
import checkoutApi from "./checkoutApi";
import mergeApi from "./mergeApi";
import mergeRequestApi from "storybook/stories/extensions/Catalog/Git/Merge/MergeRequests/mergeRequestApi";

export const BranchActions: StoryObj<{ currentBranch: string }> = {
	args: {
		currentBranch: "branch",
	},
	render: (props) => (
		<BranchActionsSrc
			show={true}
			setShow={() => {}}
			currentBranch={props.currentBranch}
			tabWrapperRef={null}
			isInitNewBranch={false}
			setIsInitNewBranch={() => {}}
		/>
	),
};

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/BranchActions",
	decorators: [BlockDecorator],
	parameters: {
		msw: mock([...checkoutApi, ...mergeApi, ...mergeRequestApi]),
	},
};

export default meta;
