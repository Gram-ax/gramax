import linkFilter from "./linkFilter";
import { ListItem } from "@components/List/Item";
import { ReactElement } from "react";

const mockItems: ListItem[] = [
	{
		labelField: "Статья 1",
		element: {
			type: "div",
			props: {
				item: {
					pathname: "catalog/docs/article1.md",
				},
			},
		} as ReactElement,
	},
	{
		labelField: "Руководство 2",
		element: {
			type: "div",
			props: {
				item: {
					pathname: "catalog/docs/guides/guide2.md",
				},
			},
		} as ReactElement,
	},
	{
		labelField: "Обучающий материал 3",
		element: {
			type: "div",
			props: {
				item: {
					pathname: "catalog/tutorials/tutorial3.md",
				},
			},
		} as ReactElement,
	},
	{
		labelField: "tutorials",
		element: {
			type: "div",
			props: {
				item: {
					pathname: "catalog/docs/article2.md",
				},
			},
		} as ReactElement,
	},
];

describe("linkFilter", () => {
	test("должен возвращать все элементы при пустом вводе", () => {
		const result = linkFilter(mockItems, "");
		expect(result).toEqual(mockItems);
	});

	test("должен фильтровать элементы по заголовку", () => {
		const result = linkFilter(mockItems, "Статья");
		expect(result).toHaveLength(1);
		expect(result[0].labelField).toBe("Статья 1");
	});

	test("должен фильтровать элементы по пути", () => {
		const result = linkFilter(mockItems, "guides");
		expect(result).toHaveLength(1);
		expect(result[0].labelField).toBe("Руководство 2");
	});

	test("должен возвращать null, если совпадений не найдено", () => {
		const result = linkFilter(mockItems, "несуществующий");
		expect(result).toBeNull();
	});

	test("должен возвращать элементы, совпадающие по заголовку или пути", () => {
		const result = linkFilter(mockItems, "tutorials");
		expect(result).toHaveLength(2);
		expect(result[0].labelField).toBe("tutorials");
		expect(result[1].labelField).toBe("Обучающий материал 3");
	});
});
