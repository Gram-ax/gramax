import ArticleComponentSrc from "@components/Layouts/CatalogLayout/ArticleLayout/ArticleComponent";
import RightNavigationComponent from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigationComponent";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useEffect } from "react";

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
	useEffect(() => {
		SidebarsIsPinService.value = { left: isPin };
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
			rightNav={<RightNavigationComponent />}
		/>
	);
};

export default ArticleData;
