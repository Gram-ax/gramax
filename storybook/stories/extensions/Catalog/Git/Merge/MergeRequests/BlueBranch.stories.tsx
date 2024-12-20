import BlueBranchSrc from "@ext/git/actions/Branch/components/BlueBranch";
import { Meta, StoryObj } from "@storybook/react";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";
import getZoomDecorator from "storybook/styles/decorators/getZoomDecorator";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Merge/MergeRequests/BlueBranch",
	decorators: [BlockDecorator, getZoomDecorator()],
};
export default meta;

export const BlueBranch: StoryObj = {
	render: () => <BlueBranchSrc name="master" />,
};
