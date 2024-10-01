import Icon from "@components/Atoms/Icon";
import Link from "@components/Atoms/Link";
import UiUrlUtils from "@components/libs/UiUrlUtils";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import styled from "@emotion/styled";
import { ItemLink } from "./NavigationLinks";

const NextPrevious = ({ itemLinks }: { itemLinks: ItemLink[] }) => {
	const articleLinks = UiUrlUtils.getArticleLinks(itemLinks);
	const idx = articleLinks.findIndex((x) => x.isCurrentLink);
	return idx >= 0 ? (
		<div
			className="next-previous"
			style={{ display: "flex", justifyContent: "space-between", paddingBottom: "20px" }}
		>
			<Arrow link={articleLinks[idx - 1]} next={false} />
			<Arrow link={articleLinks[idx + 1]} next={true} />
		</div>
	) : null;
};

export default NextPrevious;

const Arrow = styled(({ next, link, className }: { next: boolean; link: ItemLink; className?: string }) => {
	const articleElement = ArticleRefService.value.current;

	return (
		<div className={className}>
			{link && (
				<Link
					href={link}
					onClick={() =>
						articleElement?.scrollTo({
							top: 0,
							left: 0,
							behavior: "smooth",
						})
					}
					dataQa={"jump-to-" + (next ? "next" : "prev")}
				>
					<Icon code={next ? "arrow-right" : "arrow-left"} />
					<span>{link.title}</span>
				</Link>
			)}
		</div>
	);
})`
	flex: 1;
	min-width: 0;
	display: flex;
	justify-content: flex-${(p) => (p.next ? "end" : "start")};

	a {
		min-width: 0;
		display: flex;
		font-size: 13px;
		width: fit-content;
		align-items: center;
		text-decoration: none;
		color: var(--color-primary-general);
	}
	a:hover {
		color: var(--color-primary);
	}
	a span {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		padding-right: var(--distance-i-span);
		order: ${(p) => (p.next ? -1 : 1)};
	}

	@media print {
		display: none !important;
	}
`;
