import styled from "@emotion/styled";

const CatalogLayout = styled(
	({ catalogNav, article, className }: { catalogNav: JSX.Element; article: JSX.Element; className?: string }) => {
		return (
			<div className={"catalog-layout " + className}>
				{catalogNav}
				{article}
			</div>
		);
	},
)`
	width: 100%;
	height: 100%;
	display: flex;

	@page {
		size: auto;
	}

	@media print {
		overflow: visible;
		height: auto;

		.left-nav-wrapper,
		.right-nav-wrapper {
			display: none !important;
		}

		.article-fixed-container {
			height: auto !important;
			overflow: visible !important;
			padding-left: 0 !important;
			padding-right: 0 !important;
		}

		* {
			overflow: visible !important;
			transition: none !important;
		}
	}
`;

export default CatalogLayout;
