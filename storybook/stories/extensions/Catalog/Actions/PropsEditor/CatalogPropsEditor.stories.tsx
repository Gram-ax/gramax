// import { JSONSchema7, validate } from "json-schema";
import Style from "@components/HomePage/Cards/model/Style";
import { Meta, StoryObj } from "@storybook/react";
import CatalogPropsEditor from "../../../../../../core/extensions/catalog/actions/propsEditor/components/CatalogPropsEditor";
import CatalogEditProps from "../../../../../../core/extensions/catalog/actions/propsEditor/model/CatalogEditProps";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

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
			style: Style.blue,
		};

		return (
			<CatalogStoreProvider data={props as any}>
				<CatalogPropsEditor onSubmit={console.log} />
			</CatalogStoreProvider>
		);
	},
};
