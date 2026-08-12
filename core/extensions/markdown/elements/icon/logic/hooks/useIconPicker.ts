import { useIconCategories, useIconDataStore } from "@components/Atoms/Icon/IconDataStore";
import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { useBaseLucideIconList } from "@components/Atoms/Icon/lucideIconList";
import { useCustomIconsList } from "@ext/markdown/elements/icon/logic/hooks/useCustomIconsList";
import type { IconEntry } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import { useMemo } from "react";

type ConvertedCategory = {
	[category: string]: IconEntry[];
};

type UseIconPickerReturn = {
	icons: IconEntry[] | ConvertedCategory;
	categories: CategoryWithIcon;
};

const CATALOG_CATEGORY = "catalog-icons-title";

const RECENTLY_USED_CATEGORY = "recently-used-icons";

export type CategoryRepresentativeIcon = { code: IconCode; svg?: string };

export type CategoryWithIcon = { [category: string]: CategoryRepresentativeIcon };

export const useIconPicker = (disableCatalogIcons: boolean): UseIconPickerReturn => {
	const lucideIconList = useBaseLucideIconList();
	const categories = useIconCategories(true);
	const lastUsedIcons = useIconDataStore((s) => s.lastUsedIcons);
	const customIcons = useCustomIconsList();

	const { icons, categories: categoriesWithIcon } = useMemo(() => {
		const categoriesWithIcon: CategoryWithIcon = {};
		const usedInCategory = new Set<string>();
		const usedIcons = new Set<string>();

		const prefixCategories: ConvertedCategory = {};
		const prefixCategoryHeaders: CategoryWithIcon = {};
		const mapCustomIcon = new Map<string, string>();

		customIcons.forEach((i) => {
			mapCustomIcon.set(i.code, i.svg);
		});

		if (lastUsedIcons.length > 0) {
			const recentIcons = [...lastUsedIcons].reverse().flatMap((code) => {
				if (code.startsWith("custom:")) {
					if (disableCatalogIcons) return [];
					const svg = mapCustomIcon.get(code.slice("custom:".length));
					if (!svg) return [];
					return [{ code: code as IconCode, svg }];
				}
				return [{ code: code as IconCode }];
			});
			if (recentIcons.length > 0) {
				prefixCategories[RECENTLY_USED_CATEGORY] = recentIcons;
				prefixCategoryHeaders[RECENTLY_USED_CATEGORY] = { code: "clock" };
			}
		}

		if (customIcons.length > 0 && !disableCatalogIcons) {
			const catalogIcons = customIcons.map((i) => ({ code: i.code as IconCode, svg: mapCustomIcon.get(i.code) }));
			prefixCategories[CATALOG_CATEGORY] = catalogIcons;
			prefixCategoryHeaders[CATALOG_CATEGORY] = { code: catalogIcons[0].code, svg: catalogIcons[0].svg };
		}

		if (Object.keys(categories).length > 0) {
			const icons = Object.entries(categories).reduce((acc, [icon, cats]) => {
				cats.forEach((category) => {
					if (usedIcons.has(icon)) return;
					if (!categoriesWithIcon[category] && !usedInCategory.has(icon)) {
						categoriesWithIcon[category] = { code: icon as IconCode };
						usedInCategory.add(icon);
					}
					acc[category] = [...(acc[category] || []), { code: icon as IconCode }];
					usedIcons.add(icon);
				});
				return acc;
			}, {} as ConvertedCategory);

			return {
				icons: { ...prefixCategories, ...icons },
				categories: { ...prefixCategoryHeaders, ...categoriesWithIcon },
			};
		}

		if (Object.keys(prefixCategories).length > 0) {
			const flat = lucideIconList.map((i) => ({ code: i.value }));
			return {
				icons: { ...prefixCategories, Lucide: flat },
				categories: { ...prefixCategoryHeaders, Lucide: { code: flat[0].code } },
			};
		}

		return { icons: lucideIconList.map((i) => ({ code: i.value })), categories: {} };
	}, [categories, customIcons, lastUsedIcons, lucideIconList, disableCatalogIcons]);

	return { icons, categories: categoriesWithIcon };
};
