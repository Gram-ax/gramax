import listItemNodeTransformer from "@ext/markdown/elements/list/edit/models/taskItem/logic/listItemNodeTransformer";

describe("Трансформирование в пункт списка задач", () => {
	test("Трансформирование list_item в task_item", async () => {
		const resultData = await listItemNodeTransformer(getInitialData());

		expect(JSON.stringify(getExpectedData())).toBe(JSON.stringify(resultData.value));
	});
});

function getInitialData() {
	return {
		type: "list_item",
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
		type: "task_item",
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
