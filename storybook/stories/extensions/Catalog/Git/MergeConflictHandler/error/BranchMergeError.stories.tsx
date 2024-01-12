import { Meta, StoryObj } from "@storybook/react";
import mock from "storybook/data/mock";
import InlineDecorator from "../../../../../../styles/decorators/InlineDecorator";
import { BranchMergeConflictError as BranchMergeConflictErrorSrc } from "../../BranchActions/errors/BranchMergeConflictError.stories";
import { BranchMergeNotSupportedError as BranchMergeNotSupportedErrorSrc } from "../../BranchActions/errors/BranchMergeNotSupportedError.stories";
import branchApiErrorData from "../../BranchActions/errors/branchApiErrorData";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Merge/Error/Branch",
	decorators: [InlineDecorator],
	parameters: { msw: mock(branchApiErrorData) },
};

export default meta;

export const Conflict: StoryObj = BranchMergeConflictErrorSrc;

export const NotSupported: StoryObj = BranchMergeNotSupportedErrorSrc;
