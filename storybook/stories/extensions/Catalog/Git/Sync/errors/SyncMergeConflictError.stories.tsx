import ErrorModal from "@ext/errorHandlers/client/components/ErrorModal";
import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import mock from "storybook/data/mock";
import InlineDecorator from "storybook/styles/decorators/InlineDecorator";
import syncApiErrorData from "./syncApiErrorData";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Sync/Error/SyncMergeConflictError",
	decorators: [InlineDecorator],
	parameters: { msw: mock(syncApiErrorData) },
};

export default meta;

export const SyncMergeConflictError: StoryObj = {
	render: () => {
		const [error, setError] = useState<any>(null);
		return (
			<>
				<div
					onClick={() =>
						setError({
							props: {
								mergeType: MergeType.Sync,
								errorCode: GitErrorCode.MergeConflictError,
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
