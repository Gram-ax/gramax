// import { JSONSchema7, validate } from "json-schema";
import Style from "@components/HomePage/Cards/model/Style";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { Meta, StoryObj } from "@storybook/react";
import CatalogPropsEditor from "../../../../../../core/extensions/catalog/actions/propsEditor/components/CatalogPropsEditor";
import CatalogEditProps from "../../../../../../core/extensions/catalog/actions/propsEditor/model/CatalogEditProps.schema";

const meta: Meta = {
	title: "gx/extensions/Catalog/Actions/PropsEditor",
	parameters: {
		// msw: mockApi([
		// 	{
		// 		path: "/api/catalog/getBrotherFileNames",
		// 		response: ["test_url", "test_url_1"],
		// 		mimeType: MimeTypes.json,
		// 	},
		// ]),
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
			<CatalogPropsService.Provider value={props as any}>
				<CatalogPropsEditor trigger={<div>Открыть настройки</div>} onSubmit={console.log} />
			</CatalogPropsService.Provider>
		);
	},
};
