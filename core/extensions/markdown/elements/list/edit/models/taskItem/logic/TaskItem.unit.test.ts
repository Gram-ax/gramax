import listItemNodeTransformer from "@ext/markdown/elements/list/edit/models/taskItem/logic/listItemNodeTransformer";

describe("Трансформирование в пункт списка задач", () => {
	test("Трансформирование listItem в taskItem", async () => {
		const resultData = await listItemNodeTransformer(getInitialData());

		expect(JSON.stringify(getExpectedData())).toBe(JSON.stringify(resultData.value));
	});
});

function getInitialData() {
	return {
		type: "listItem",
		attrs: {
			isTaskItem: true,
		},
		content: [
			{
				type: "paragraph",
				content: [
					{
						type: "text",
						text: "d",
					},
				],
			},
		],
	};
}

function getExpectedData() {
	return {
		type: "taskItem",
		attrs: {
			checked: true,
		},
		content: [
			{
				type: "paragraph",
				content: [
					{
						type: "text",
						text: "d",
					},
				],
			},
		],
	};
}
