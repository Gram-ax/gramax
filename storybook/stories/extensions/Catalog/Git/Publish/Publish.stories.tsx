import PublishSrc from "../../../../../../core/extensions/git/actions/Publish/components/Publish";
import mockApi from "../../../../../logic/api/mockApi";
import BlockDecorator from "../../../../../styles/decorators/BlockDecorator";
import publishApiData from "./publishApiData";
const PublishData = {
	title: "DocReader/extensions/Catalog/Git/Publish",
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
		msw: mockApi([
			{
				path: "/api/versionControl/diffItems",
				response: publishApiData,
				delay: 100,
				// errorMessage: "diffItems error",
			},
			{
				path: "/api/storage/publish",
				delay: 100,
				// errorMessage: "publish error",
			},
			{
				path: "/api/versionControl/discard",
				delay: 100,
				// errorMessage: "discard error",
			},
		]),
	},
};

export const Publish = () => {
	return <PublishSrc />;
};

export default PublishData;
