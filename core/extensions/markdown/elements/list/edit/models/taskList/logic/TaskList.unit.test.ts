import taskListNodeTransformer from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListNodeTransformer";

describe("Трансформирование в список задач", () => {
	test("Трансформирование маркированного списка", async () => {
		const resultData = await taskListNodeTransformer(getInitialData());

		expect(JSON.stringify(getExpectedData())).toBe(JSON.stringify(resultData.value));
	});
});

function getInitialData() {
	return {
		type: "bullet_list",
		attrs: { tight: false, containTaskList: true },
		content: [
			{
				type: "task_item",
				attrs: {
					checked: false,
				},
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "first",
							},
						],
					},
				],
			},
			{
				type: "task_item",
				attrs: { checked: true },
				content: [{ type: "paragraph", content: [{ type: "text", text: "second" }] }],
			},
		],
	};
}

function getExpectedData() {
	return {
		type: "task_list",
		attrs: {},
		content: [
			{
				type: "task_item",
				attrs: {
					checked: false,
				},
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "first",
							},
						],
					},
				],
			},
			{
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
								text: "second",
							},
						],
					},
				],
			},
		],
	};
}
