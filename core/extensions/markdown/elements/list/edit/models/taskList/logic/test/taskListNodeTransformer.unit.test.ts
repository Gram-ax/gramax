import taskListNodeTransformer from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListNodeTransformer";

describe("Трансформирование в список задач", () => {
	test("Трансформирование маркированного списка", async () => {
		const resultData = await taskListNodeTransformer(getInitialData());

		expect(JSON.stringify(getExpectedData())).toBe(JSON.stringify(resultData.value));
	});
});

function getInitialData() {
	return {
		type: "bulletList",
		attrs: { tight: false, containTaskList: true },
		content: [
			{
				type: "taskItem",
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
				type: "taskItem",
				attrs: { checked: true },
				content: [{ type: "paragraph", content: [{ type: "text", text: "second" }] }],
			},
		],
	};
}

function getExpectedData() {
	return {
		type: "taskList",
		attrs: {},
		content: [
			{
				type: "taskItem",
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
								text: "second",
							},
						],
					},
				],
			},
		],
	};
}
