import { Meta, StoryObj } from "@storybook/react";
import mock from "storybook/data/mock";
import CloneSrc from "../../../../../core/extensions/git/actions/Clone/components/CloneModal";
import BlockDecorator from "../../../../styles/decorators/InlineDecorator";

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Clone",
	decorators: [BlockDecorator],
	parameters: {
		msw: mock([
			{
				path: "/api/storage/clone",
				delay: 1000,
				errorMessage: "clone error",
			},
		]),
	},
};
export default meta;

export const Clone: StoryObj = {
	render: () => <CloneSrc trigger={<div>Clone trigger</div>} />,
};
