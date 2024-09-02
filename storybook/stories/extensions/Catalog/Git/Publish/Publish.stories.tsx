import ArticlePublishTrigger from "@ext/git/actions/Publish/components/ArticlePublishTrigger";
import mock from "storybook/data/mock";
import publishApi from "storybook/stories/extensions/Catalog/Git/Publish/publishApi";
import BlockDecorator from "../../../../../styles/decorators/BlockDecorator";

const PublishData = {
	title: "gx/extensions/Catalog/Git/Publish",
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
		msw: mock(publishApi),
	},
};

export const Publish = () => {
	return <ArticlePublishTrigger />;
};

export default PublishData;
