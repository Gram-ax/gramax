import { Meta, StoryObj } from "@storybook/react";
import mock from "storybook/data/mock";
import InlineDecorator from "../../../../../../styles/decorators/InlineDecorator";
import { SyncMergeConflictError as SyncMergeConflictErrorSrc } from "../../Sync/errors/SyncMergeConflictError.stories";
import { SyncMergeNotSupportedError as SyncMergeNotSupportedErrorSrc } from "../../Sync/errors/SyncMergeNotSupportedError.stories";
import syncApiErrorData from "../../Sync/errors/syncApiErrorData";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Merge/Error/Sync",
	decorators: [InlineDecorator],
	parameters: { msw: mock(syncApiErrorData) },
};

export default meta;

export const Conflict: StoryObj = SyncMergeConflictErrorSrc;

export const NotSupported: StoryObj = SyncMergeNotSupportedErrorSrc;
