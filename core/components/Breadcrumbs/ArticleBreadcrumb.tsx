import styled from "@emotion/styled";
import { ArticleLink, BaseLink, CatalogLink, CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { CatalogLogo } from "../CatalogLogo";
import Breadcrumb from "./Breadcrumb";

export default styled(
	({
		itemLinks,
		catalogLink,
		readyData,
		className,
	}: {
		itemLinks?: ItemLink[];
		catalogLink?: CatalogLink;
		readyData?: { titles: string[]; links: BaseLink[] };
		className?: string;
	}) => {
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

		return (
			<div
				className={className + " breadcrumb"}
				style={catalogLink || (titles.length && categoryLinks.length) ? {} : { display: "none" }}
			>
				{catalogLink ? (
					<>
						<a className="catalog-logo">
							<CatalogLogo catalogName={catalogLink.name} />
							<span className="title">{catalogLink.title}</span>
						</a>
					</>
				) : null}
				{titles.length && categoryLinks.length ? (
					<div className="article-breadcrumb">
						<Breadcrumb
							content={titles.map((t, i) => ({
								text: t,
								link: categoryLinks[i],
							}))}
						/>
					</div>
				) : null}
			</div>
		);
	},
)`
	img {
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

	.article-breadcrumb {
		margin-top: -0.6rem;
	}

	.catalog-logo {
		display: flex;
		align-items: center;
	}
`;
