import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import mock from "storybook/data/mock";
import ErrorModal from "../../../../../../../core/extensions/errorHandlers/client/components/ErrorModal";
import GitErrorCode from "../../../../../../../core/extensions/git/core/GitCommands/errors/model/GitErrorCode";
import InlineDecorator from "../../../../../../styles/decorators/InlineDecorator";
import branchApiErrorData from "./branchApiErrorData";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/BranchActions/errors/BranchMergeNotSupportedError",
	decorators: [InlineDecorator],
	parameters: { msw: mock(branchApiErrorData) },
};

export default meta;

export const BranchMergeNotSupportedError: StoryObj = {
	render: () => {
		const [error, setError] = useState<any>(null);
		return (
			<>
				<div
					onClick={() =>
						setError({
							props: {
								mergeType: MergeType.Branches,
								errorCode: GitErrorCode.MergeNotSupportedError,
								theirs: "123",
							},
						})
					}
				>
					trigger
				</div>
				<ErrorModal error={error} setError={setError} />
			</>
		);
	},
};
