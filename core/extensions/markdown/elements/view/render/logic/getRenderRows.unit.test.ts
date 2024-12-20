import getRenderRows from "@ext/markdown/elements/view/render/logic/getRenderRows";
import { ViewRenderGroup } from "@ext/properties/models";

describe("GetRenderRows", () => {
	test("many", () => {
		const data = {
			group: ["analysis"],
			subgroups: [
				{
					group: ["AM"],
					subgroups: [
						{
							group: ["SF"],
							subgroups: [{ group: null, articles: [{ title: "Образ браузерной версии" }] }],
						},
					],
				},
				{
					group: ["AL"],
					subgroups: [
						{
							group: ["SY"],
							subgroups: [{ group: null, articles: [{ title: "Проверка наличия лицензии" }] }],
						},
					],
				},
				{
					group: ["EP"],
					subgroups: [
						{
							group: ["SF"],
							articles: [],
							subgroups: [{ group: null, articles: [{ title: "Комментарии на сайт" }] }],
						},
					],
				},
			],
		} as ViewRenderGroup;

		const result = getRenderRows(data, []);
		expect(result).toStrictEqual([
			[
				{ name: "analysis", rowSpan: 3 },
				{ name: "AM", rowSpan: 1 },
				{ name: "SF", rowSpan: 1 },
				{ article: { title: "Образ браузерной версии" } },
			],
			[
				{ name: "AL", rowSpan: 1 },
				{ name: "SY", rowSpan: 1 },
				{ article: { title: "Проверка наличия лицензии" } },
			],
			[{ name: "EP", rowSpan: 1 }, { name: "SF", rowSpan: 1 }, { article: { title: "Комментарии на сайт" } }],
		]);
	});
});
