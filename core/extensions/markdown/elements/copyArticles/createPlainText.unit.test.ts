import createPlainText from "@ext/markdown/elements/copyArticles/createPlainText";

const createContainer = (html: string) => {
	const container = document.createElement("div");
	container.innerHTML = html;
	return container;
};

const createRange = (html: string) => {
	const container = createContainer(html);
	const range = document.createRange();
	range.selectNodeContents(container);
	return range;
};

describe("createPlainText", () => {
	test("целый список", () => {
		const range = createRange(
			"<li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ul><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></ul></li><li><p>wrtwrt</p></li><li><p>rw</p></li></ul></li><li><p>wrtwrt</p></li>",
		);

		const testData = createPlainText(range);
		const expectedData = `- jwrhtbkrwj
	- wrjkbtkjwrlt
	- wrktkjwkt
		- jrwjktrwnk
		- rjwhtkjwlrkt
			- kwjrbhktjrwt
		- wrtrwt
	- wrtwrt
	- rw
- wrtwrt`;
		expect(testData).toBe(expectedData);
	});

	test("обрезанный список", () => {
		const range = createRange(
			"<li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ul><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li>",
		);

		const testData = createPlainText(range);
		const expectedData = `- jwrhtbkrwj
	- wrjkbtkjwrlt
	- wrktkjwkt
		- jrwjktrwnk
		- rjwhtkjwlrkt
			- kwjrbhktjrwt
		- wrtrwt
`;
		expect(testData).toBe(expectedData);
	});

	test("список с текстом", () => {
		const range = createRange(
			"<p>amogus</p><p>abobus amogus</p><p>abobus</p><li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ul><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></ul></li><li><p>wrtwrt</p></li><li><p>rw</p></li></ul></li><li><p>wrtwrt</p></li>",
		);

		const testData = createPlainText(range);
		const expectedData = `amogus
abobus amogus
abobus
- jwrhtbkrwj
	- wrjkbtkjwrlt
	- wrktkjwkt
		- jrwjktrwnk
		- rjwhtkjwlrkt
			- kwjrbhktjrwt
		- wrtrwt
	- wrtwrt
	- rw
- wrtwrt`;
		expect(testData).toBe(expectedData);
	});

	test("изображение и список", () => {
		const range = createRange(
			"<img src='amogus.png' /><li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ul><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></ul></li><li><p>wrtwrt</p></li><li><p>rw</p></li></ul></li><li><p>wrtwrt</p></li>",
		);

		const testData = createPlainText(range);
		const expectedData = `- jwrhtbkrwj
	- wrjkbtkjwrlt
	- wrktkjwkt
		- jrwjktrwnk
		- rjwhtkjwlrkt
			- kwjrbhktjrwt
		- wrtrwt
	- wrtwrt
	- rw
- wrtwrt`;
		expect(testData).toBe(expectedData);
	});

	test("два разных списка", () => {
		const range = createRange(
			"<li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ol><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></ol></li><li><p>wrtwrt</p></li><li><p>rw</p></li></ul></li><li><p>wrtwrt</p></li>",
		);

		const testData = createPlainText(range);
		const expectedData = `- jwrhtbkrwj
	- wrjkbtkjwrlt
	- wrktkjwkt
		1. jrwjktrwnk
		2. rjwhtkjwlrkt
			- kwjrbhktjrwt
		3. wrtrwt
	- wrtwrt
	- rw
- wrtwrt`;
		expect(testData).toBe(expectedData);
	});

	test("list item с дополнительным текстом", () => {
		const range = createRange(
			"<li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><p>text</p><ol><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></ol></li><li><p>wrtwrt</p></li><li><p>rw</p></li></ul></li><li><p>wrtwrt</p></li>",
		);

		const testData = createPlainText(range);
		const expectedData = `- jwrhtbkrwj
	- wrjkbtkjwrlt
	- wrktkjwkt
	  text
		1. jrwjktrwnk
		2. rjwhtkjwlrkt
			- kwjrbhktjrwt
		3. wrtrwt
	- wrtwrt
	- rw
- wrtwrt`;
		expect(testData).toBe(expectedData);
	});

	test("обычный текст с инлайн кодом", () => {
		const range = createRange(
			"<p>jwrhtbkrwj</p><p>wrjkbtkjwrlt</p><p>wrktkjwkt</p><p>text</p><p>jrwjktrwnk <code>code</code></p><p>rjwhtkjwlrkt</p><p>kwjrbhktjrwt</p><p>wrtrwt</p><p>wrtwrt</p><p>rw</p>",
		);

		const testData = createPlainText(range);
		const expectedData = `jwrhtbkrwj
wrjkbtkjwrlt
wrktkjwkt
text
jrwjktrwnk code
rjwhtkjwlrkt
kwjrbhktjrwt
wrtrwt
wrtwrt
rw`;
		expect(testData).toBe(expectedData);
	});

	test("копирование текста из list item", () => {
		const range = createRange("<li><p>jwrhtbkrwj <code>code</code></p></li>");

		const testData = createPlainText(range);
		const expectedData = `jwrhtbkrwj code`;
		expect(testData).toBe(expectedData);
	});

	test("копирование текста из других элементов", () => {
		const range = createRange(
			"<div><p>jwrhtbkrwj</p><li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ul><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></div>",
		);

		const testData = createPlainText(range);
		const expectedData = `jwrhtbkrwj
- jwrhtbkrwj
	- wrjkbtkjwrlt
	- wrktkjwkt
		- jrwjktrwnk
		- rjwhtkjwlrkt
			- kwjrbhktjrwt
		- wrtrwt`;
		expect(testData).toBe(expectedData);
	});

	test("копирование текста из code block", () => {
		const range = createRange(
			`<pre><div data-node-view-content="" style="white-space: pre-wrap;"><div data-node-view-content-react="" style="white-space: inherit;"><span class="hljs-built_in">print</span>(<span class="hljs-string">"hello gramax"</span>)
<span class="hljs-built_in">print</span>(<span class="hljs-string">"huesos"</span>)</div></div></pre>`,
		);

		const testData = createPlainText(range);
		const expectedData = `print("hello gramax")
print("huesos")`;
		expect(testData).toBe(expectedData);
	});

	test("копирование task list", () => {
		const range = createRange(
			`<ul data-type="taskList"><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwjthkjwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtwrjthjklwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtwrjktnwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjrwkltwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtkjwrtwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjkwrhtkrwt</p></div></li></ul>`,
		);

		const testData = createPlainText(range);
		const expectedData = `- [ ] rwjthkjwrt
- [ ] rwtwrjthjklwrt
- [ ] wrtwrjktnwrt
- [ ] rwtjrwkltwrt
- [ ] wrtkjwrtwrt
- [ ] rwtjkwrhtkrwt`;
		expect(testData).toBe(expectedData);
	});

	test("task item с текстом", () => {
		const range = createRange(
			`<li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwjthkjwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtwrjthjklwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtwrjktnwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjrwkltwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtkjwrtwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjkwrhtkrwt</p></div></li>`,
		);

		const testData = createPlainText(range);
		const expectedData = `- [ ] rwjthkjwrt
- [ ] rwtwrjthjklwrt
- [ ] wrtwrjktnwrt
- [ ] rwtjrwkltwrt
- [ ] wrtkjwrtwrt
- [ ] rwtjkwrhtkrwt`;
		expect(testData).toBe(expectedData);
	});

	test("task item с текстом и дополнительным текстом", () => {
		const range = createRange(
			`<p>123</p><ul data-type="taskList"><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwjthkjwrt</p></div></li><li data-checked="true"><label contenteditable="false"><input type="checkbox" checked><span></span></label><div><p>rwtwrjthjklwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtwrjktnwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjrwkltwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtkjwrtwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjkwrhtkrwt</p></div></li></ul><p>456</p>`,
		);

		const testData = createPlainText(range);
		const expectedData = `123
- [ ] rwjthkjwrt
- [x] rwtwrjthjklwrt
- [ ] wrtwrjktnwrt
- [ ] rwtjrwkltwrt
- [ ] wrtkjwrtwrt
- [ ] rwtjkwrhtkrwt
456`;
		expect(testData).toBe(expectedData);
	});

	test("task item со вложенным списком", () => {
		const range = createRange(
			`<ul data-type="taskList"><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwjthkjwrt</p><ul data-type="taskList"><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtwrjthjklwrt</p></div></li></ul></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtwrjktnwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjrwkltwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtkjwrtwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjkwrhtkrwt</p></div></li></ul>`,
		);

		const testData = createPlainText(range);
		const expectedData = `- [ ] rwjthkjwrt
	- [ ] rwtwrjthjklwrt
- [ ] wrtwrjktnwrt
- [ ] rwtjrwkltwrt
- [ ] wrtkjwrtwrt
- [ ] rwtjkwrhtkrwt`;
		expect(testData).toBe(expectedData);
	});

	test("task item со вложенным списком без ul", () => {
		const range = createRange(
			`<li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwjthkjwrt</p><ul data-type="taskList"><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtwrjthjklwrt</p></div></li></ul></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtwrjktnwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjrwkltwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>wrtkjwrtwrt</p></div></li><li data-checked="false"><label contenteditable="false"><input type="checkbox"><span></span></label><div><p>rwtjkwrhtkrwt</p></div></li>`,
		);

		const testData = createPlainText(range);
		const expectedData = `- [ ] rwjthkjwrt
	- [ ] rwtwrjthjklwrt
- [ ] wrtwrjktnwrt
- [ ] rwtjrwkltwrt
- [ ] wrtkjwrtwrt
- [ ] rwtjkwrhtkrwt`;
		expect(testData).toBe(expectedData);
	});
});
