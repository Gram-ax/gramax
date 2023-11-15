import getTocItems from "./createTocItems";

describe("getTocItems", () => {
	test("првильно вадает TocItems по levelTocItems", () => {
		const levelTocItems = [
			{ level: 2, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 2, url: "", title: "", items: [] },
		];

		const testTocItems = [
			{ level: 2, url: "", title: "", items: [{ level: 3, url: "", title: "", items: [] }] },
			{ level: 2, url: "", title: "", items: [] },
		];

		const TocItems = getTocItems(levelTocItems);
		expect(testTocItems).toEqual(TocItems);
	});

	test("првильно вадает2 TocItems по levelTocItems", () => {
		const levelTocItems = [
			{ level: 2, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 4, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 4, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 2, url: "", title: "", items: [] },
			{ level: 2, url: "", title: "", items: [] },
			{ level: 4, url: "", title: "", items: [] },
		];

		const testTocItems = [
			{
				items: [
					{
						items: [{ items: [], level: 4, title: "", url: "" }],
						level: 3,
						title: "",
						url: "",
					},
					{
						items: [{ items: [], level: 4, title: "", url: "" }],
						level: 3,
						title: "",
						url: "",
					},
					{ items: [], level: 3, title: "", url: "" },
					{ items: [], level: 3, title: "", url: "" },
				],
				level: 2,
				title: "",
				url: "",
			},
			{ items: [], level: 2, title: "", url: "" },
			{
				items: [{ items: [], level: 4, title: "", url: "" }],
				level: 2,
				title: "",
				url: "",
			},
		];

		const TocItems = getTocItems(levelTocItems);
		expect(testTocItems).toEqual(TocItems);
	});
});
