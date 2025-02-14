import FormattedBranchSrc from "@ext/git/actions/Branch/components/FormattedBranch";
import { Meta, StoryObj } from "@storybook/react";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";
import getZoomDecorator from "storybook/styles/decorators/getZoomDecorator";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Merge/MergeRequests/FormattedBranch",
	decorators: [BlockDecorator, getZoomDecorator()],
};
export default meta;

export const FormattedBranch: StoryObj = {
	render: () => <FormattedBranchSrc name="master" />,
};
