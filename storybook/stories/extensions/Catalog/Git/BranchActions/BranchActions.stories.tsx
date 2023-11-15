import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import GitErrorCode from "@ext/git/core/GitRepository/errors/model/GitErrorCode";
import { Meta, StoryObj } from "@storybook/react";
import BranchActionsSrc from "../../../../../../core/extensions/git/actions/Branch/components/BranchActions";
import mockApi from "../../../../../logic/api/mockApi";
import BlockDecorator from "../../../../../styles/decorators/InlineDecorator";
import checkoutApi from "./checkoutApi";

export const BranchActions: StoryObj<{ currentBranch: string }> = {
	args: {
		currentBranch: "branch",
	},
	render: (props) => (
		<BranchActionsSrc currentBranch={props.currentBranch} trigger={<span>Branch actions trigger</span>} />
	),
};

const meta: Meta = {
	title: "DocReader/extensions/Catalog/Git/BranchActions",
	decorators: [BlockDecorator],
	parameters: {
		msw: mockApi([
			...checkoutApi,
			{
				path: "/api/versionControl/branch/mergeInto",
				delay: 500,
				errorProps: {
					mergeType: MergeType.Branches,
					errorCode: GitErrorCode.MergeConflictError,
					theirs: "123",
				},
			},
		]),
	},
};

export default meta;
