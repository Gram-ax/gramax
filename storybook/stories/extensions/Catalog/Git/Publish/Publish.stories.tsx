import mock from "storybook/data/mock";
import publishApi from "storybook/stories/extensions/Catalog/Git/Publish/publishApi";
import PublishSrc from "../../../../../../core/extensions/git/actions/Publish/components/Publish";
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
	return <PublishSrc />;
};

export default PublishData;
