import { Meta, StoryObj } from "@storybook/react";
import mock from "storybook/data/mock";
import BranchActionsSrc from "../../../../../../core/extensions/git/actions/Branch/components/BranchActions";
import BlockDecorator from "../../../../../styles/decorators/InlineDecorator";
import checkoutApi from "./checkoutApi";
import mergeApi from "./mergeApi";

export const BranchActions: StoryObj<{ currentBranch: string }> = {
	args: {
		currentBranch: "branch",
	},
	render: (props) => (
		<BranchActionsSrc currentBranch={props.currentBranch} trigger={<span>Branch actions trigger</span>} />
	),
};

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/BranchActions",
	decorators: [BlockDecorator],
	parameters: {
		msw: mock([...checkoutApi, ...mergeApi]),
	},
};

export default meta;
