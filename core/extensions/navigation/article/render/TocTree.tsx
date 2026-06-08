import useGetHref from "@core-ui/useGetHref";
import { cn } from "@core-ui/utils/cn";
import { TocLink, type TocLinkLevel } from "@ext/navigation/article/render/TocLink";
import { useTocActiveUrl } from "@ext/navigation/article/render/TocScrollspy";
import type { TocItem } from "../logic/createTocItems";

export const TocCategory = ({ item, level }: { item: TocItem; level: TocLinkLevel }) => {
	const href = useGetHref(item.url);
	const activeUrl = useTocActiveUrl();

	if (!item.title) return null;

	return (
		<ul className="!mt-0 !pl-5 !-ml-5 list-none !mb-0">
			<li className="flex flex-row !mb-0 !leading-none">
				<TocLink active={activeUrl === href} href={href} level={level}>
					{item.title}
				</TocLink>
			</li>
			<TocList items={item.items} level={item.title ? ((level + 1) as TocLinkLevel) : level} />
		</ul>
	);
};

const TocListItem = ({ item, level }: { item: TocItem; level: TocLinkLevel }) => {
	const href = useGetHref(item.url);
	const activeUrl = useTocActiveUrl();

	if (item.items?.length) return <TocCategory item={item} level={level} />;

	return (
		<TocLink active={activeUrl === href} href={href} level={level}>
			{item.title}
		</TocLink>
	);
};

export const TocList = ({ items, level, className }: { items: TocItem[]; level: TocLinkLevel; className?: string }) => (
	<ul className={cn("!mt-0 !mb-0 !pl-5 !-ml-5 list-none", className)}>
		{items.map((x) => (
			<li className="!mb-0 !leading-none" key={x.url}>
				<TocListItem item={x} level={level} />
			</li>
		))}
	</ul>
);
