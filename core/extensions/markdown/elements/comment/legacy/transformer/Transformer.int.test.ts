import { CommentBlock } from "@core-ui/CommentBlock";
import { getParserTestData } from "../../../../core/Parser/test/getParserTestData";
import { transformModelToNode, transformNodeToModel } from "./Transformer";

describe("Трансформер комментариев правильно трансформирует ", () => {
	const node = {
		type: "comment_old",
		attrs: { mail: "danil.kazanov@ics-it.ru", dateTime: "2022-09-06T09|29|40.612Z", isResolved: false },
		content: [
			{ type: "paragraph", content: [{ type: "text", text: "comment text" }] },
			{
				type: "answer",
				attrs: { mail: "stanislav.yargunkin@ics-it.ru", dateTime: "2022-09-06T09|29|40.612Z" },
				content: [{ type: "paragraph", content: [{ type: "text", text: "answer text 1" }] }],
			},
			{
				type: "answer",
				attrs: { mail: "danil.kazanov@ics-it.ru", dateTime: "2022-09-06T09|29|40.612Z" },
				content: [{ type: "paragraph", content: [{ type: "text", text: "answer text 2" }] }],
			},
		],
	};

	const model: CommentBlock = {
		comment: {
			user: { mail: "danil.kazanov@ics-it.ru", name: "Test UserName" },
			dateTime: "2022-09-06T09:29:40.612Z",
			content: [{ type: "paragraph", content: [{ type: "text", text: "comment text" }] }],
		},
		answers: [
			{
				user: { mail: "stanislav.yargunkin@ics-it.ru", name: "Test UserName" },
				dateTime: "2022-09-06T09:29:40.612Z",
				content: [{ type: "paragraph", content: [{ type: "text", text: "answer text 1" }] }],
			},
			{
				user: { mail: "danil.kazanov@ics-it.ru", name: "Test UserName" },
				dateTime: "2022-09-06T09:29:40.612Z",
				content: [{ type: "paragraph", content: [{ type: "text", text: "answer text 2" }] }],
			},
		],
	};

	test("узел в модель", async () => {
		const args = await getParserTestData();
		const transformedNode = await transformNodeToModel(node, args.parseContext);

		expect(transformedNode).toEqual(model);
	});

	test("модель в узел", () => {
		const transformedModel = transformModelToNode(Object.assign({}, model));

		expect(transformedModel).toEqual(node);
	});
});
