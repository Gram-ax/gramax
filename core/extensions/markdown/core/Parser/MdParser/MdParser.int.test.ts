import getTagElementRenderModels from "../../render/logic/getRenderElements/getTagElementRenderModels";
import { getParserTestData } from "../test/getParserTestData";
import MdParser from "./MdParser";

const getMdParser = async () => {
	const args = await getParserTestData();
	return new MdParser({ tags: getTagElementRenderModels(args.parseContext) });
};

describe("MdParser корректно парсит", () => {
	test("тег DocReader в тег Markdoc", async () => {
		const mdParser = await getMdParser();

		const str = "[test:text1:text2]";
		const parsedStr = `{%test attr1="text1" attr2="text2" /%}`;
		mdParser.use({
			render: "Test",
			attributes: {
				attr1: { type: String },
				attr2: { type: String },
			},
		});

		const testParseStr = mdParser.preParse(str);

		expect(testParseStr).toEqual(parsedStr);
	});

	describe("Br в тег Markdoc", () => {
		test("квадртаный", async () => {
			const mdParser = await getMdParser();
			const str = "[br]";
			const parsedStr = `{%br  /%}`;
			mdParser.use({
				render: "Br",
			});

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		describe("video", () => {
			test("путь до SharePoint", async () => {
				const mdParser = await getMdParser();
				const str = "[video:videopath/deep/deeper.mp4:videoTitle]";
				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(`{%video path="videopath/deep/deeper.mp4" title="videoTitle" /%}`);
			});

			test("http ссылка", async () => {
				const mdParser = await getMdParser();
				const str = "[video:http://example/video/1.mp4:videoTitle]";
				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(`{%video path="http://example/video/1.mp4" title="videoTitle" /%}`);
			});
		});

		describe("Br", () => {
			const parsedStr = `{%br  /%}`;

			test("квадртаный", async () => {
				const mdParser = await getMdParser();
				const str = "[br]";
				mdParser.use({
					render: "Br",
				});

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("угловой", async () => {
				const mdParser = await getMdParser();
				const str = "<br>";
				mdParser.use({
					render: "Br",
				});

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});

		describe("тире", () => {
			const str = `-- --- d--- \\--  --d d--d d-- \n-- \n\\--`;
			const parsedStr = `— --- d--- \\--  —d d—d d— \n— \n\\--`;
			test("preParse", async () => {
				const mdParser = await getMdParser();
				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("backParse", async () => {
				const mdParser = await getMdParser();
				const testParseStr = mdParser.backParse(parsedStr);

				expect(testParseStr).toEqual(str);
			});
		});

		test("include", async () => {
			const mdParser = await getMdParser();
			const str = `### [include:path]`;
			const parsedStr = `{%include path="path" gratings="###" /%}`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		describe("стрелочки", () => {
			const str = `--> ---> \\--> -->d d-->d d--> \n--> \n\\-->`;
			const parsedStr = `→ -→ \\--> →d d→d d→ \n→ \n\\-->`;
			test("preParse", async () => {
				const mdParser = await getMdParser();
				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
			test("backParse", async () => {
				const mdParser = await getMdParser();
				const testParseStr = mdParser.backParse(parsedStr);

				expect(testParseStr).toEqual(str);
			});
		});

		test("ковычки", async () => {
			const mdParser = await getMdParser();
			const str = `aaaaa"aaa"bbb"aaa"aaaaaa`;
			const parsedStr = `aaaaa«aaa»bbb«aaa»aaaaaa`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});
		describe("формулы", () => {
			test("простая строка", async () => {
				const mdParser = await getMdParser();
				const str = `текст $L = \\frac{1}{2} \\rho v^2 S C_L$ текст`;
				const parsedStr = `текст {%formula content="$L = \\\\frac{1}{2} \\\\rho v^2 S C_L$" /%} текст`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("несколько подряд", async () => {
				const mdParser = await getMdParser();
				const str = `$E = mc^2$$$$ \\int_a^b f(x)\\,dx = F(b) - F(a) $$$$E = mc^2$`;
				const parsedStr = `{%formula content="$E = mc^2$" /%}\${%formula content="$$ \\\\int_a^b f(x)\\\\,dx = F(b) - F(a) $$" /%}\${%formula content="$E = mc^2$" /%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});

		describe("заметки в тег Markdoc", () => {
			test("с типом и заголовком", async () => {
				const mdParser = await getMdParser();
				const str = `
:::someType someTitle
childrenText
someChildrenText
someMoreChildrenText
:::`;
				const parsedStr = `
{%note type="someType" title="someTitle" collapsed="false" %}
childrenText
someChildrenText
someMoreChildrenText
{%/note%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("с типом, заголовком и в свернутом состоянии", async () => {
				const mdParser = await getMdParser();
				const str = `
:::someType:true someTitle
childrenText
someChildrenText
someMoreChildrenText
:::`;
				const parsedStr = `
{%note type="someType" title="someTitle" collapsed="true" %}
childrenText
someChildrenText
someMoreChildrenText
{%/note%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("без типа и заголовка", async () => {
				const mdParser = await getMdParser();
				const str = `
			:::
			test
			:::`;
				const parsedStr = `
			{%note type="" title="" collapsed="false" %}
			test
			{%/note%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("image в note", async () => {
				const mdParser = await getMdParser();
				const str = `
				:::
				[image:./src.png:::0,0,100,100::]
				:::
				`;
				const parsedStr = `
				{%note type="" title="" collapsed="false" %}
				{%image src="./src.png" alt="" title="" crop="0,0,100,100" scale="" objects="" /%}
				{%/note%}
				`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("без note в image", async () => {
				const mdParser = await getMdParser();
				const str = `
				[image:./src.png:::0,0,100,100::]
				[image:./src.png:::0,0,100,100::]
				`;
				const parsedStr = `
				{%image src="./src.png" alt="" title="" crop="0,0,100,100" scale="" objects="" /%}
				{%image src="./src.png" alt="" title="" crop="0,0,100,100" scale="" objects="" /%}
				`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});


			test("note в списке", async () => {
				const mdParser = await getMdParser();

				const str = `test

-  test test test test test test test test test

   :::tip test test test test test

   test test test test test test test test test test

   :::

test test test test test test

:::tip test test test test test test

test test test test test test

:::

test test test test`;

				const parsedStr = `test

-  test test test test test test test test test

   {%note type="tip" title="test test test test test" collapsed="false" %}

   test test test test test test test test test test

   {%/note%}

test test test test test test

{%note type="tip" title="test test test test test test" collapsed="false" %}

test test test test test test

{%/note%}

test test test test`;
				mdParser.use({
					render: "Test",
					attributes: {
						attr1: { type: String },
						attr2: { type: String },
					},
				});

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});

		describe("тег id в тег Markdoc", () => {
			const parsedStr = `{% #my-id %}`;

			test("квадратный", async () => {
				const mdParser = await getMdParser();
				const str = `[#:my-id]`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("фигурный", async () => {
				const mdParser = await getMdParser();
				const str = `{#my-id}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("фигурный с пробелом", async () => {
				const mdParser = await getMdParser();
				const str = `{ #my-id }`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});

		describe("комментарии", () => {
			test("строчные", async () => {
				const mdParser = await getMdParser();
				const str = `текст <!-- комментарий --> текст`;
				const parsedStr = `текст  текст`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});

			test("блочные", async () => {
				const mdParser = await getMdParser();
				const str = `текст <!-- комментарий\nкомментарий2\nкомментарий3\n--> текст`;
				const parsedStr = `текст  текст`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});
		test("переменные", async () => {
			const mdParser = await getMdParser();
			const str = `{% $lang %} {% $user.name %}`;
			const parsedStr = `{% $lang %} {% $user.name %}`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("двойные ковычки", async () => {
			const mdParser = await getMdParser();
			const str = `[cut:test test "test"]`;
			const parsedStr = `{%cut text="test test \\"test\\"" %}`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("комментарий", async () => {
			const mdParser = await getMdParser();
			const str = `[comment:email:time]\n[/comment]`;
			const parsedStr = `{%comment count="email" undefined="time" %}\n{%/comment%}`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("ответ на комментарий", async () => {
			const mdParser = await getMdParser();
			const str = `[answer:email:time]\n[/answer]`;
			const parsedStr = `{%answer mail="email" dateTime="time" %}\n{%/answer%}`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});
	});

	describe("пропускает", () => {
		describe("экранирование", () => {
			test("тег DocReader", async () => {
				const mdParser = await getMdParser();
				const str = "\\[ [test:text1:text2] \\]";
				const parsedStr = `\\[ {%test attr1="text1" attr2="text2" /%} \\]`;
				mdParser.use({
					render: "Test",
					attributes: {
						attr1: { type: String },
						attr2: { type: String },
					},
				});

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});

		describe("блок кода", () => {
			describe("инлайновый", () => {
				test("тег DocReader", async () => {
					const mdParser = await getMdParser();
					const str = "`[test:text1:text2]`";
					const parsedStr = "`[test:text1:text2]`";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
			});

			describe("блочный", () => {
				test("тег DocReader", async () => {
					const mdParser = await getMdParser();
					const str = "```\n[test:text1:text2]\n```";
					const parsedStr = "```\n[test:text1:text2]\n```";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
			});
			describe("внутри блока кода", () => {
				test("без языка", async () => {
					const mdParser = await getMdParser();
					const str = "```\n```\n[test:text1:text2]\n```\n```";
					const parsedStr = "```\n```\n[test:text1:text2]\n```\n```";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
				test("с языком", async () => {
					const mdParser = await getMdParser();
					const str = "```yaml\n```md\n[test:text1:text2]\n```\n```";
					const parsedStr = "```yaml\n```md\n[test:text1:text2]\n```\n```";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
				test("с пробелами", async () => {
					const mdParser = await getMdParser();
					const str = "```\n```\n    [test:text1:text2]\n    [test:text3:textx4]\n```\n```";
					const parsedStr = "```\n```\n    [test:text1:text2]\n    [test:text3:textx4]\n```\n```";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
				test("с другим кодом блока", async () => {
					const mdParser = await getMdParser();
					const str = `
	\`\`\`
	wpdawpld
	\`\`\`

	\`\`\`
		\`\`\`ts-diagram
		<описание диаграммы>
		\`\`\`
	\`\`\`
	`;
					const parsedStr = `
	\`\`\`
	wpdawpld
	\`\`\`

	\`\`\`
		\`\`\`ts-diagram
		<описание диаграммы>
		\`\`\`
	\`\`\`
	`;
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
			});
			describe("внутри блока кода", () => {
				test("без языка", async () => {
					const mdParser = await getMdParser();
					const str = "```\n```\n[test:text1:text2]\n```\n```";
					const parsedStr = "```\n```\n[test:text1:text2]\n```\n```";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
				test("с языком", async () => {
					const mdParser = await getMdParser();
					const str = "```yaml\n```md\n[test:text1:text2]\n```\n```";
					const parsedStr = "```yaml\n```md\n[test:text1:text2]\n```\n```";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
				test("с пробелами", async () => {
					const mdParser = await getMdParser();
					const str = "```\n```\n    [test:text1:text2]\n    [test:text3:textx4]\n```\n```";
					const parsedStr = "```\n```\n    [test:text1:text2]\n    [test:text3:textx4]\n```\n```";
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
				test("с другим кодом блока", async () => {
					const mdParser = await getMdParser();
					const str = `
	\`\`\`
	wpdawpld
	\`\`\`

	\`\`\`
		\`\`\`ts-diagram
		<описание диаграммы>
		\`\`\`
	\`\`\`
	`;
					const parsedStr = `
	\`\`\`
	wpdawpld
	\`\`\`

	\`\`\`
		\`\`\`ts-diagram
		<описание диаграммы>
		\`\`\`
	\`\`\`
	`;
					mdParser.use({
						render: "Test",
						attributes: {
							attr1: { type: String },
							attr2: { type: String },
						},
					});

					const testParseStr = mdParser.preParse(str);

					expect(testParseStr).toEqual(parsedStr);
				});
			});
		});
	});

	describe("пустые строки в пустые строки с неразрывным пробелом", () => {
		test("1", async () => {
			const mdParser = await getMdParser();

			const str = "Paragraph\n\n\n\nParagraph";
			const parsedStr = `Paragraph\n\n&nbsp;\n\nParagraph`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("2", async () => {
			const mdParser = await getMdParser();

			const str = "Paragraph\n\n\n\n\n\nParagraph";
			const parsedStr = `Paragraph\n\n&nbsp;\n\n&nbsp;\n\nParagraph`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("3", async () => {
			const mdParser = await getMdParser();

			const str = "Paragraph\n\n\n\n\n\n\n\nParagraph";
			const parsedStr = `Paragraph\n\n&nbsp;\n\n&nbsp;\n\n&nbsp;\n\nParagraph`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("4", async () => {
			const mdParser = await getMdParser();

			const str = "Paragraph\n\n\n\n\n\n\n\n\n\nParagraph";
			const parsedStr = `Paragraph\n\n&nbsp;\n\n&nbsp;\n\n&nbsp;\n\n&nbsp;\n\nParagraph`;

			const testParseStr = mdParser.preParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});
	});

	describe("элемент списка без текста на той же строке, что и пункт списка", () => {
		test("маркированный", async () => {
			const mdParser = await getMdParser();

			const str = `
-  
   text`;
			const parsedStr = `
-  \u00A0
   text`;

			const testParseStr = mdParser.backParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("нумерованный", async () => {
			const mdParser = await getMdParser();

			const str = `
1. 
   text`;
			const parsedStr = `
1. \u00A0
   text`;

			const testParseStr = mdParser.backParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});

		test("многомерный", async () => {
			const mdParser = await getMdParser();

			const str = `
1. 1
   text
2. 
   1. 
      -  i
      -  ii
      -  
         iii
   2. b`;
			const parsedStr = `
1. 1
   text
2. \u00A0
   1. \u00A0
      -  i
      -  ii
      -  \u00A0
         iii
   2. b`;

			const testParseStr = mdParser.backParse(str);

			expect(testParseStr).toEqual(parsedStr);
		});
	});

	test("таблица с пустыми строками", async () => {
		const mdParser = await getMdParser();

		const str = `
{% table %}

---

*  {% isHeader=true %}

   

   text

*  

   text

*  text

   text

---

*  {% isHeader=true %}

   text

*  text

*  

{% /table %}`;
		const parsedStr = `
{% table %}

---

*  {% isHeader=true %}

   

   text

*  \u00A0

   text

*  text

   text

---

*  {% isHeader=true %}

   text

*  text

*  \u00A0

{% /table %}`;

		const testParseStr = mdParser.backParse(str);

		expect(testParseStr).toEqual(parsedStr);
	});
	describe("html теги", () => {
		describe("без атрибутов", () => {
			test("инлайн", async () => {
				const mdParser = await getMdParser();

				const str = "[html] <tag></tag> [/html]";
				const parsedStr = `{%html %}\n\`\`\`\n <tag></tag> \n\`\`\`\n{%/html%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
			test("блочный", async () => {
				const mdParser = await getMdParser();

				const str = "[html]\n<tag></tag>\n[/html]";
				const parsedStr = `{%html %}\n\`\`\`\n\n<tag></tag>\n\n\`\`\`\n{%/html%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});
		describe("с атрибутами", () => {
			test("инлайн", async () => {
				const mdParser = await getMdParser();

				const str = `[html] <tag attr1="1" attr2="2"></tag> [/html]`;
				const parsedStr = `{%html %}\n\`\`\`\n <tag attr1="1" attr2="2"></tag> \n\`\`\`\n{%/html%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
			test("блочный", async () => {
				const mdParser = await getMdParser();

				const str = `[html]\n<tag attr1="1" attr2="2"></tag>\n[/html]`;
				const parsedStr = `{%html %}\n\`\`\`\n\n<tag attr1="1" attr2="2"></tag>\n\n\`\`\`\n{%/html%}`;

				const testParseStr = mdParser.preParse(str);

				expect(testParseStr).toEqual(parsedStr);
			});
		});
	});
});
