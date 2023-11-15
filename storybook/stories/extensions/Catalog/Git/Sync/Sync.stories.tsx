import { Meta, StoryObj } from "@storybook/react";
import SyncSrc from "../../../../../../core/extensions/git/actions/Sync/Sync";
import mockApi from "../../../../../logic/api/mockApi";
import BlockDecorator from "../../../../../styles/decorators/BlockDecorator";
import syncApiData from "./syncApiData";

const meta: Meta = {
	title: "DocReader/extensions/Catalog/Git/Sync",
	decorators: [
		(Story) => (
			<div
				style={{
					background: "black",
					width: "100px",
					height: "25px",
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Story />
			</div>
		),
		BlockDecorator,
	],
	parameters: {
		msw: mockApi(syncApiData),
	},
};

export default meta;

export const Sync: StoryObj = {
	render: () => <SyncSrc />,
};
