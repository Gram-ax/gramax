import ArticlePublishTrigger from "@ext/git/actions/Publish/components/ArticlePublishTrigger";
import Publish from "@ext/git/actions/Publish/components/Publish";
import { Meta, StoryObj } from "@storybook/react";
import mock from "storybook/data/mock";
import publishApi from "storybook/stories/extensions/Catalog/Git/Publish/publishApi";
import BlockDecorator from "../../../../../styles/decorators/BlockDecorator";

const PublishData: Meta = {
	title: "gx/extensions/Catalog/Git/Publish",
	parameters: { msw: mock(publishApi) },
};

export const PublishModal: StoryObj = {
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
	render: () => {
		return <ArticlePublishTrigger />;
	},
};

export const PublishComponent: StoryObj = {
	render: () => {
		return <Publish goToArticleOnClick={() => console.log("go to article on click")} />;
	},
};

export const PublishLeftNavOnlyComponent: StoryObj = {
	render: () => {
		return (
			<div style={{ height: "80vh" }}>
				<Publish
					goToArticleOnClick={() => console.log("go to article on click")}
					renderLeftSidebarOnly
					onOpenIdChange={console.log}
				/>
			</div>
		);
	},
};

export default PublishData;
