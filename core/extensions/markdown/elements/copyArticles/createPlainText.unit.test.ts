import createPlainText from "@ext/markdown/elements/copyArticles/createPlainText";

const createContainer = (html: string) => {
	const container = document.createElement("div");
	container.innerHTML = html;
	return container;
};

const createListDocument = (additionalText?: string) => {
	const list = document.createElement("ul");
	list.innerHTML =
		"<li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ul><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></ul></li><li><p>wrtwrt</p></li><li><p>rw</p></li></ul></li><li><p>wrtwrt</p></li>";
	return createContainer(additionalText ? `${additionalText}${list.outerHTML}` : list.outerHTML);
};

const createTwoListDocument = () => {
	const list = document.createElement("ul");
	list.innerHTML =
		"<li><p>jwrhtbkrwj</p><ul><li><p>wrjkbtkjwrlt</p></li><li><p>wrktkjwkt</p><ol><li><p>jrwjktrwnk</p></li><li><p>rjwhtkjwlrkt</p><ul><li><p>kwjrbhktjrwt</p></li></ul></li><li><p>wrtrwt</p></li></ol></li><li><p>wrtwrt</p></li><li><p>rw</p></li></ul></li><li><p>wrtwrt</p></li>";
	return createContainer(list.outerHTML);
};

describe("createPlainText", () => {
	test("целый список", () => {
		const range = document.createRange();
		const container = createListDocument();
		document.body.appendChild(container);
		range.selectNodeContents(container);

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
- wrtwrt
`;
		expect(testData).toBe(expectedData);
		document.body.removeChild(container);
	});

	test("список с текстом", () => {
		const range = document.createRange();
		const container = createListDocument("<p>amogus</p><p>abobus amogus</p><p>abobus</p>");
		document.body.appendChild(container);
		range.selectNodeContents(container);

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
- wrtwrt
`;
		expect(testData).toBe(expectedData);
		document.body.removeChild(container);
	});

	test("изображение и список", () => {
		const range = document.createRange();
		const container = createListDocument("<img src='amogus.png' />");
		document.body.appendChild(container);
		range.selectNodeContents(container);

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
- wrtwrt
`;
		expect(testData).toBe(expectedData);
		document.body.removeChild(container);
	});

	test("два разных списка", () => {
		const range = document.createRange();
		const container = createTwoListDocument();
		document.body.appendChild(container);
		range.selectNodeContents(container);

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
- wrtwrt
`;
		expect(testData).toBe(expectedData);
		document.body.removeChild(container);
	});
});
