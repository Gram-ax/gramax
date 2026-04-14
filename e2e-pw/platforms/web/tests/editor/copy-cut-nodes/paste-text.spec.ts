import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

const markdownContent = md`
	## Heading level 2

	### Heading level 3

	#### Heading level 4

	---

	### Bullet list:

	-  Item 1

	-  Item 2

	-  Subitem 2.1

	-  Subitem 2.2

	-  Item 3

	### Ordered list:

	1. First element

	-  Sub of first element

	-  Another sub of first element

	1. Second element

	-  Sub of second element

	-  Another sub of second element

	1. Third element

	-  Sub of third element

	-  Another sub of third element

	---

	**Bold text** and *italic* together.

	**Bold and *italic* text**.

	*Italic and ~~strikethrough~~ text*.

	**Bold text with ~~strikethrough~~ and *italic* together**.

	---

	\`\`\`python
	# Code block example

	def greet(name):
	return f"Hello, {name}!"

	print(greet("World"))
	\`\`\`
`;

editorTest.describe("Paste Text", () => {
	editorTest("indented text pasted without indent", async ({ editor }) => {
		await editor.pasteText(md`Проверка товаров на наличие брендов

Цель

Проверить принадлежит ли товар производителю

Исходные данные

    Справочник с наименованиями товара
        Не более 255 символов
        Регистр не имеет значения
    Справочник с эталонными наименованиями брендов

        Содержит наименования брендов на нескольких языках. 

    Рассматриваем только ENG и RUS.

        Регистр не имеет значения`);

		await editor.assertMarkdown(md`Проверка товаров на наличие брендов

Цель

Проверить принадлежит ли товар производителю

Исходные данные

Справочник с наименованиями товара

Не более 255 символов

Регистр не имеет значения

Справочник с эталонными наименованиями брендов

Содержит наименования брендов на нескольких языках.

Рассматриваем только ENG и RUS.

Регистр не имеет значения`);
	});

	editorTest("paste markdown into article", async ({ editor }) => {
		await editor.press("ControlOrMeta+A Backspace");
		await editor.pasteText(markdownContent);
		await editor.assertMarkdownContains("## Heading level 2");
		await editor.assertMarkdownContains("-  Item 1");
		await editor.assertMarkdownContains("**Bold text** and *italic* together.");
		await editor.assertMarkdownContains("```python");
	});

	editorTest("paste markdown into code block", async ({ editor }) => {
		await editor.press("ControlOrMeta+A Backspace");
		await editor.clickToolbar("code");
		await editor.pasteText(markdownContent);
		await editor.assertMarkdownContains(md`
			\`\`\`
			## Heading level 2
		`);
	});
});
