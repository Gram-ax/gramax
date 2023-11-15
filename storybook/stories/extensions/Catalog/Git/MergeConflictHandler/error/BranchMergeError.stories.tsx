import { Meta, StoryObj } from "@storybook/react";
import mockApi from "../../../../../../logic/api/mockApi";
import InlineDecorator from "../../../../../../styles/decorators/InlineDecorator";
import { BranchMergeConflictError as BranchMergeConflictErrorSrc } from "../../BranchActions/errors/BranchMergeConflictError.stories";
import { BranchMergeNotSupportedError as BranchMergeNotSupportedErrorSrc } from "../../BranchActions/errors/BranchMergeNotSupportedError.stories";
import branchApiErrorData from "../../BranchActions/errors/branchApiErrorData";

const meta: Meta = {
	title: "DocReader/extensions/Catalog/Git/Merge/Error/Branch",
	decorators: [InlineDecorator],
	parameters: { msw: mockApi(branchApiErrorData) },
};

export default meta;

export const Conflict: StoryObj = BranchMergeConflictErrorSrc;

export const NotSupported: StoryObj = BranchMergeNotSupportedErrorSrc;
