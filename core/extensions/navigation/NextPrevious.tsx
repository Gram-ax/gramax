import Link from "@components/Atoms/Link";
import UiUrlUtils from "@components/libs/UiUrlUtils";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { cn } from "@core-ui/utils/cn";
import { Icon } from "@ui-kit/Icon";
import type { ItemLink } from "./NavigationLinks";

const Arrow = ({ next, link }: { next: boolean; link: ItemLink }) => {
	const articleElement = ArticleRefService.value.current;

	if (!link) return <div className="flex-1" />;

	return (
		<div className={cn("flex min-w-0 flex-1 print:hidden", next ? "justify-end" : "justify-start")}>
			<Link
				className={cn(
					"flex min-w-0 w-fit items-center no-underline text-sm",
					"text-[var(--color-primary-general)] hover:text-[var(--color-primary)]",
				)}
				dataQa={`jump-to-${next ? "next" : "prev"}`}
				href={link}
				onClick={() => articleElement?.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
			>
				{!next && <Icon icon="arrow-left" />}
				<span className={cn("overflow-hidden whitespace-nowrap text-ellipsis px-[var(--distance-i-span)]")}>
					{link.title}
				</span>
				{next && <Icon icon="arrow-right" />}
			</Link>
		</div>
	);
};

const NextPrevious = ({ itemLinks }: { itemLinks: ItemLink[] }) => {
	const articleLinks = UiUrlUtils.getArticleLinks(itemLinks);
	const idx = articleLinks.findIndex((x) => x.isCurrentLink);

	if (idx < 0) return null;

	return (
		<div className="flex justify-between pb-8">
			<Arrow link={articleLinks[idx - 1]} next={false} />
			<Arrow link={articleLinks[idx + 1]} next={true} />
		</div>
	);
};

export default NextPrevious;
