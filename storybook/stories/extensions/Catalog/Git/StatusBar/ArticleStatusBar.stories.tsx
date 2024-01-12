import ArticleStatusBarSrc from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar";
import { Meta, StoryObj } from "@storybook/react";
import { ComponentProps } from "react";
import mock from "storybook/data/mock";
import checkoutApi from "../BranchActions/checkoutApi";
import syncApiData from "../Sync/syncApiData";
import CenterDecorator from "storybook/styles/decorators/CenterDecorator";
import publishApi from "storybook/stories/extensions/Catalog/Git/Publish/publishApi";

type Props = ComponentProps<typeof ArticleStatusBarSrc>;

const meta: Meta<Props> = {
	title: "gx/extensions/Catalog/Git/ArticleStatusBar",
	decorators: [
		(Story) => {
			return (
				<div style={{ width: "300px" }}>
					<Story />
				</div>
			);
		},
		CenterDecorator,
	],
	args: {
		isStorageInitialized: true,
	},
	parameters: {
		msw: mock([
			...checkoutApi,
			...syncApiData,
			...publishApi,
			{ path: "https://api.github.com/user", response: [] },
			{ path: "api/versionControl/branch/get", response: { name: "master" }, delay: 2000 },
		]),
	},
};

export default meta;

export const ArticleStatusBar: StoryObj<Props> = {
	render: (props) => {
		return <ArticleStatusBarSrc {...props} />;
	},
};
