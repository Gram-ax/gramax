import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import mockApi from "../../../../logic/api/mockApi";
import checkoutApi from "../../../extensions/Catalog/Git/BranchActions/checkoutApi";
import logo from "./logo";

const CatalogArticleData = {
	title: "DocReader/core/Catalog/CatalogArticle",
	decorators: [
		(S) => (
			<div style={{ background: "white", width: "100%", height: "100%" }}>
				<S />
			</div>
		),
	],
	parameters: {
		msw: mockApi([{ path: "/api/catalog/logo", response: logo, mimeType: MimeTypes.svg }, ...checkoutApi]),
	},
};

export const CatalogArticle = () => {
	// const data = pageProps.data as any;
	// const article = (
	// 	<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 		<div>content content content content content</div>
	// 	</div>
	// );
	return (
		// <CatalogComponent data={data} article={article} />
		<></>
	);
};

export default CatalogArticleData;
