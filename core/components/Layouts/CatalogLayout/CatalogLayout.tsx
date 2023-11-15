import styled from "@emotion/styled";

const CatalogLayout = styled(
	({ catalogNav, article, className }: { catalogNav: JSX.Element; article: JSX.Element; className?: string }) => {
		return (
			<div data-qa="catalog" className={"catalog-layout " + className}>
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
		* {
			overflow: visible !important;
			transition: none !important;
		}
	}
`;

export default CatalogLayout;
