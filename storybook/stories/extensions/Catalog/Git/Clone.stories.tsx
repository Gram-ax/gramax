import { Meta, StoryObj } from "@storybook/react";
import CloneSrc from "../../../../../core/extensions/git/actions/Clone/components/Clone";
import mockApi from "../../../../logic/api/mockApi";
import BlockDecorator from "../../../../styles/decorators/InlineDecorator";

const meta: Meta = {
	title: "DocReader/extensions/Catalog/Git/Clone",
	decorators: [BlockDecorator],
	parameters: {
		msw: mockApi([
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
