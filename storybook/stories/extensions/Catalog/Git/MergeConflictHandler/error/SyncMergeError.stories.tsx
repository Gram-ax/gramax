import { Meta, StoryObj } from "@storybook/react";
import mockApi from "../../../../../../logic/api/mockApi";
import InlineDecorator from "../../../../../../styles/decorators/InlineDecorator";
import { SyncMergeConflictError as SyncMergeConflictErrorSrc } from "../../Sync/errors/SyncMergeConflictError.stories";
import { SyncMergeNotSupportedError as SyncMergeNotSupportedErrorSrc } from "../../Sync/errors/SyncMergeNotSupportedError.stories";
import syncApiErrorData from "../../Sync/errors/syncApiErrorData";

const meta: Meta = {
	title: "DocReader/extensions/Catalog/Git/Merge/Error/Sync",
	decorators: [InlineDecorator],
	parameters: { msw: mockApi(syncApiErrorData) },
};

export default meta;

export const Conflict: StoryObj = SyncMergeConflictErrorSrc;

export const NotSupported: StoryObj = SyncMergeNotSupportedErrorSrc;
