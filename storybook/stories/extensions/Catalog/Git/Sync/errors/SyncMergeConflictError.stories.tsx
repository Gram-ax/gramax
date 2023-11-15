import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import ErrorModal from "../../../../../../../core/extensions/errorHandlers/client/components/ErrorModal";
import GitErrorCode from "../../../../../../../core/extensions/git/core/GitRepository/errors/model/GitErrorCode";
import mockApi from "../../../../../../logic/api/mockApi";
import InlineDecorator from "../../../../../../styles/decorators/InlineDecorator";
import syncApiErrorData from "./syncApiErrorData";

const meta: Meta = {
	title: "DocReader/extensions/Catalog/Git/Sync/Error/SyncMergeConflictError",
	decorators: [InlineDecorator],
	parameters: { msw: mockApi(syncApiErrorData) },
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
