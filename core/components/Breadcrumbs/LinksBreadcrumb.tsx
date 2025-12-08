import { useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import styled from "@emotion/styled";
import { ArticleLink, BaseLink, CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, MutableRefObject } from "react";
import Breadcrumb from "./Breadcrumb";

interface BreadcrumbProps {
	itemLinks?: ItemLink[];
	catalog?: { name: string; title: string };
	readyData?: { titles: string[]; links: BaseLink[] };
	className?: string;
}

const LinksBreadcrumb = forwardRef((props: BreadcrumbProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { itemLinks, catalog, readyData, className } = props;
	const { isExist, src } = useGetCatalogLogoSrc(catalog?.name);

	let titles: string[] = [];
	let lastIsIndexArticle = false;
	let categoryLinks: BaseLink[] = [];

	const setTitlesAndLinks = (newCategoryLinks: CategoryLink[]) => {
		titles = newCategoryLinks.map((l) => l.title);
		categoryLinks = newCategoryLinks;
	};

	const search = (itemLinks: ItemLink[], catLinks: CategoryLink[]) => {
		itemLinks.forEach((x) => {
			if (!(x as CategoryLink).items) {
				if ((x as ArticleLink).isCurrentLink) {
					setTitlesAndLinks(catLinks);
					lastIsIndexArticle = false;
				}
			} else {
				const categoryLink = x as CategoryLink;
				const newCategoryLinks = [...catLinks, categoryLink];
				if (categoryLink.isCurrentLink) {
					setTitlesAndLinks(newCategoryLinks);
					lastIsIndexArticle = true;
				} else search(categoryLink.items, newCategoryLinks);
			}
		});
	};

	if (itemLinks) search(itemLinks, []);
	if (lastIsIndexArticle) titles.pop();
	if (readyData) {
		titles = readyData.titles;
		categoryLinks = readyData.links;
	}

	if (!titles.length && !catalog) return <div />;
	return (
		<div
			ref={ref}
			className={className + " breadcrumb"}
			style={catalog || (titles.length && categoryLinks.length) ? {} : { visibility: "hidden" }}
		>
			{catalog && (
				<a className="catalog-logo">
					{isExist && <img src={src} alt={catalog.name} />}
					<span className="title">{catalog.title}</span>
				</a>
			)}
			<div className="article-breadcrumb">
				{titles.length && categoryLinks.length ? (
					<Breadcrumb
						content={titles.map((t, i) => ({
							text: t,
							link: categoryLinks[i],
						}))}
					/>
				) : null}
			</div>
		</div>
	);
});

export default styled(LinksBreadcrumb)`
	min-width: 0;
	display: flex;
	align-items: center;

	img {
		width: 100%;
		margin: 0px !important;
		max-width: 25px !important;
		max-height: 15px !important;
		box-shadow: none !important;
	}

	.title {
		font-size: 10px;
		font-weight: 600;
		margin-left: 0.2rem;
		white-space: nowrap;
	}

	.catalog-logo {
		display: flex;
		align-items: center;
	}

	.article-breadcrumb {
		max-width: 100%;
	}
`;
