import ArticleComponentSrc from "@components/Layouts/CatalogLayout/ArticleLayout/ArticleComponent";
import RightNavigationLayout from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigationLayout";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import { useEffect } from "react";
import pageProps from "../../../data/pageProps";

const ArticleData = {
	title: "gx/core/Article/Article",
	decorators: [
		(S) => (
			<div style={{ background: "white", width: "100%", height: "100%" }}>
				<S />
			</div>
		),
	],
	args: {
		isPin: false,
	},
};

export const Article = ({ isPin }: { isPin: boolean }) => {
	const data = pageProps.data as any;
	useEffect(() => {
		SidebarsIsPinService.value = isPin;
	});

	return (
		<ArticleComponentSrc
			article={
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
					<div>content content content content content</div>
				</div>
			}
			rightNav={<RightNavigationLayout itemLinks={data.itemLinks} />}
		/>
	);
};

export default ArticleData;
