import Sidebar from "@components/Layouts/Sidebar";
import { ListItem } from "@components/List/Item";
import camelToKebabCase from "@core-ui/camelToKebabCase";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import { IconEditorProps } from "@ext/markdown/elements/icon/logic/IconProvider";
import Icon from "@ext/markdown/elements/icon/render/components/Icon";
import * as Lucide from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

export const iconFilter = (customIconsList?: IconEditorProps[], inverse?: boolean) => {
	const [categories, setCategories] = useState<{ [name: string]: string[] }>();

	const getCategories = async () => {
		try {
			const response = await fetch("https://lucide.dev/api/categories", {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setCategories(data);
		} catch (error) {
			console.error("Error fetching categories:", error);
		}
	};
	useEffect(() => {
		getCategories();
	}, []);

	const transliterationSearch = useCallback(
		(items: ListItem[], input: string): ListItem[] => {
			const filterItems = (input: string) => {
				if (!input) return items;
				const filter = (item: string): boolean => {
					if (input.endsWith(" ")) return item.endsWith(input.trim());
					return item.toLowerCase().includes(input.toLowerCase());
				};

				const filteredItemsByCode: ListItem[] = [];

				const filteredItemsByCategory: IconListProps[] = [];
				items?.map((item) => {
					if (item.isTitle || (item ? filter(item.labelField) : false)) {
						filteredItemsByCode.push(item);
						return;
					}
					if (categories && !customIconsList?.some((icon) => icon.code === item.labelField)) {
						const category = categories[item.labelField]?.find((c) => filter(c));
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
			return multiLayoutSearcher<ListItem[]>(filterItems, true)(input);
		},
		[categories],
	);

	return transliterationSearch;
};

const lucideIconList = Object.keys(Lucide.icons).map((code) => toListItem({ code: camelToKebabCase(code) }));

export default lucideIconList;
