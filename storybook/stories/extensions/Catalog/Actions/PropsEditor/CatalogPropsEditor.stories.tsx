// import { JSONSchema7, validate } from "json-schema";
import Style from "@components/HomePage/Groups/model/Style";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { Meta, StoryObj } from "@storybook/react";
import CatalogPropsEditor from "../../../../../../core/extensions/catalog/actions/propsEditor/components/CatalogPropsEditor";
import CatalogEditProps from "../../../../../../core/extensions/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import mockApi from "../../../../../logic/api/mockApi";

const meta: Meta = {
	title: "DocReader/extensions/Catalog/Actions/PropsEditor",
	parameters: {
		msw: mockApi([
			{
				path: "/api/catalog/getBrotherFileNames",
				response: ["test_url", "test_url_1"],
				mimeType: MimeTypes.json,
			},
		]),
	},
};
export default meta;

export const InlineContent: StoryObj = {
	render: () => {
		const props: CatalogEditProps = {
			title: "test name",
			url: "test_url",
			description: "test description",
			code: "test",
			style: Style.blue,
		};

		return (
			<CatalogPropsEditor trigger={<div>Открыть настройки</div>} catalogProps={props} onSubmit={console.log} />
		);
	},
};
