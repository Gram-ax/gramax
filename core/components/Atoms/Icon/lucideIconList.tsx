import Sidebar from "@components/Layouts/Sidebar";
import { ListItem } from "@components/List/Item";
import { filter } from "@components/List/ListLayout";
import camelToKebabCase from "@core-ui/camelToKebabCase";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import { useLucideModule } from "@dynamicImports/lucide-icons";
import { IconEditorProps } from "@ext/markdown/elements/icon/edit/model/types";
import Icon from "@ext/markdown/elements/icon/render/components/Icon";
import { useCallback, useMemo } from "react";
import { useIconCategories } from "./IconDataStore";

interface IconListProps extends IconEditorProps {
	category?: string;
}

export const toListItem = ({ code, svg, category }: IconListProps, inverse?: boolean): ListItem => {
	return {
		labelField: code,
		element: (
			<div style={{ width: "100%", padding: "5px 10px" }}>
				<Sidebar
					leftActions={[<Icon key={0} code={code} svg={svg} />]}
					title={code}
					rightActions={[
						category && (
							<span
								key={0}
								style={{
									lineHeight: "1rem",
									fontSize: "10px",
									padding: `0 var(--radius-large)`,
									width: "max-content",
									outline: `1px solid var(--color-block-hover${inverse ? "-inverse" : ""})`,
									borderRadius: "var(--radius-large)",
								}}
							>
								{category}
							</span>
						),
					]}
				/>
			</div>
		),
	};
};

export const toListItemByUikit = ({ code, svg, category }: IconListProps, inverse?: boolean): ListItem => {
	return {
		labelField: code,
		element: <Sidebar leftActions={[<Icon key={0} code={code} svg={svg} />]} title={code} />,
	};
};

export const iconFilter = (customIconsList?: IconEditorProps[], inverse?: boolean) => {
	const categories = useIconCategories();

	const transliterationSearch = useCallback(
		(items: ListItem[], input: string): ListItem[] => {
			const filterItems = (input: string) => {
				if (!input) return items;
				const currentFilter = filter(input);

				const filteredItemsByCode: ListItem[] = [];

				const filteredItemsByCategory: IconListProps[] = [];
				items?.map((item) => {
					if (item.isTitle || (item ? currentFilter(item.labelField) : false)) {
						filteredItemsByCode.push(item);
						return;
					}
					if (categories && !customIconsList?.some((icon) => icon.code === item.labelField)) {
						const category = categories[item.labelField]?.find((c) => currentFilter(c));
						category && filteredItemsByCategory.push({ code: item.labelField, category });
					}
				});

				const filteredItems = filteredItemsByCode?.concat(
					filteredItemsByCategory.map((icon) => toListItem(icon, inverse)),
				);
				const result = filteredItems?.filter((item, index) => {
					return !item.isTitle || (filteredItems[index + 1] && !filteredItems[index + 1].isTitle);
				});
				return result.length > 0 ? result : null;
			};
			return multiLayoutSearcher<ListItem[]>({
				sync: true,
				searcher: filterItems,
			})(input);
		},
		[categories],
	);

	return transliterationSearch;
};

export const useBaseLucideIconList = () => {
	const awaitedIcons = useLucideModule();
	const result = useMemo(() => {
		const iconKeys = awaitedIcons ? Object.keys(awaitedIcons.icons) : [];
		return iconKeys.map((code) => {
			const kebabCode = camelToKebabCase(code);
			return {
				label: kebabCode,
				value: kebabCode,
			};
		});
	}, []);

	return result;
};

export const useIconFilter = (customIconsList?: IconEditorProps[], inverse?: boolean) => {
	const categories = useIconCategories();

	const transliterationSearch = useCallback(
		(value: string, search: string): number => {
			const filterFunc = (input: string): number => {
				if (!input) return 1;

				const currentFilter = filter(input);

				if (currentFilter(value)) {
					return 1;
				}

				if (categories && !customIconsList?.some((icon) => icon.code === value)) {
					const iconCategories = categories[value];

					if (iconCategories) {
						const matchingCategory = iconCategories.find((c) => currentFilter(c));

						if (matchingCategory) {
							return 0.5;
						}
					}
				}

				return 0;
			};

			return multiLayoutSearcher<number>({
				sync: true,
				searcher: filterFunc,
			})(search);
		},
		[categories, customIconsList, inverse],
	);

	return transliterationSearch;
};

const useLucideIconLists = () => {
	const awaitedIcons = useLucideModule();
	const iconKeys = awaitedIcons ? Object.keys(awaitedIcons.icons) : [];

	const lucideIconListForUikit = iconKeys.map((code) => toListItemByUikit({ code: camelToKebabCase(code) }));
	const lucideIconList = iconKeys.map((code) => toListItem({ code: camelToKebabCase(code) }));
	const lucideIconListForUikitOptions = iconKeys.map((code) => {
		const kebabCode = camelToKebabCase(code);
		return {
			label: kebabCode,
			value: kebabCode,
		};
	});
	return { lucideIconListForUikit, lucideIconList, lucideIconListForUikitOptions };
};

export default useLucideIconLists;
