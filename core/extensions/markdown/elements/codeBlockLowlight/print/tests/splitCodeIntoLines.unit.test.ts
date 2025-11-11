import { splitCodeIntoLines } from "../splitCodeIntoLines";

describe("splitCodeIntoLines", () => {
	it("handles simple text without line breaks", () => {
		const hastTree = {
			children: [
				{
					type: "text",
					value: "const x = 42;",
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(1);
		expect(result[0].props.children[0].type).toBe("span");
		expect(result[0].props.children[0].props.className).toBe("code-line");
		expect(result[0].props.children[0].props.dangerouslySetInnerHTML.__html).toContain("const x = 42;");
	});

	it("splits text with line breaks into separate lines", () => {
		const hastTree = {
			children: [
				{
					type: "text",
					value: "line 1\nline 2\nline 3",
				},
			],
		};
		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(3);
		result.forEach((fragment, index) => {
			expect(fragment.type).toBe(Symbol.for("react.fragment"));
			const span = fragment.props.children[0];
			expect(span.type).toBe("span");
			expect(span.props.className).toBe("code-line");
			expect(span.props.dangerouslySetInnerHTML.__html).toContain(`line ${index + 1}`);
			if (index < result.length - 1) {
				expect(fragment.props.children[1]).toBe("\n");
			}
		});
	});

	it("handles empty lines correctly", () => {
		const hastTree = {
			children: [
				{
					type: "text",
					value: "line 1\n\nline 3",
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(2);
		expect(result[0].props.children[0].props.dangerouslySetInnerHTML.__html).toContain("line 1");
		expect(result[0].props.children[1]).toBe("\n");
		expect(result[1].props.children[0].props.dangerouslySetInnerHTML.__html).toContain("line 3");
	});

	it("handles elements with styled text", () => {
		const hastTree = {
			children: [
				{
					type: "element",
					tagName: "span",
					properties: { className: "keyword" },
					children: [
						{
							type: "text",
							value: "const",
						},
					],
				},
				{
					type: "text",
					value: " x = ",
				},
				{
					type: "element",
					tagName: "span",
					properties: { className: "number" },
					children: [
						{
							type: "text",
							value: "42",
						},
					],
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result[0]).toMatchInlineSnapshot(`
		<React.Fragment>
		  <span
		    className="code-line"
		    dangerouslySetInnerHTML={
		      {
		        "__html": "<span><span class="number"><span class="keyword">const</span> x = 42</span></span>",
		      }
		    }
		  />
		</React.Fragment>
	`);
	});

	it("handles multiline content within elements", () => {
		const hastTree = {
			children: [
				{
					type: "element",
					tagName: "span",
					properties: { className: "string" },
					children: [
						{
							type: "text",
							value: '"line 1\nline 2"',
						},
					],
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(2);
		expect(result[0].props.children[0].props.dangerouslySetInnerHTML.__html).toContain(
			'<span class="string">"line 1</span>',
		);
		expect(result[0].props.children[1]).toBe("\n");
		expect(result[1].props.children[0].props.dangerouslySetInnerHTML.__html).toContain(
			'<span class="string">line 2"</span>',
		);
	});

	it("handles nested elements with line breaks", () => {
		const hastTree = {
			children: [
				{
					type: "element",
					tagName: "div",
					properties: {},
					children: [
						{
							type: "element",
							tagName: "span",
							properties: { className: "comment" },
							children: [
								{
									type: "text",
									value: "// comment\n// another",
								},
							],
						},
					],
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(2);
		expect(result[0].type).toBe(Symbol.for("react.fragment"));
		expect(result[0].props.children[0].type).toBe("span");
		expect(result[0].props.children[0].props.dangerouslySetInnerHTML.__html).toContain(
			'<span class="comment">// comment</span>',
		);
		expect(result[0].props.children[1]).toBe("\n");

		expect(result[1].type).toBe(Symbol.for("react.fragment"));
		expect(result[1].props.children[0].type).toBe("span");
		expect(result[1].props.children[0].props.dangerouslySetInnerHTML.__html).toContain(
			'<span class="comment">// another</span>',
		);
	});

	it("handles mixed content with elements and text", () => {
		const hastTree = {
			children: [
				{
					type: "text",
					value: "function ",
				},
				{
					type: "element",
					tagName: "span",
					properties: { className: "function" },
					children: [
						{
							type: "text",
							value: "test",
						},
					],
				},
				{
					type: "text",
					value: "() {\n  return ",
				},
				{
					type: "element",
					tagName: "span",
					properties: { className: "keyword" },
					children: [
						{
							type: "text",
							value: "true",
						},
					],
				},
				{
					type: "text",
					value: ";\n}",
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(3);
		expect(result).toMatchInlineSnapshot(`
		[
		  <React.Fragment>
		    <span
		      className="code-line"
		      dangerouslySetInnerHTML={
		        {
		          "__html": "<span><span class="function">function test</span>() {</span>",
		        }
		      }
		    />
		    

		  </React.Fragment>,
		  <React.Fragment>
		    <span
		      className="code-line"
		      dangerouslySetInnerHTML={
		        {
		          "__html": "<span><span class="keyword">  return true</span>;</span>",
		        }
		      }
		    />
		    

		  </React.Fragment>,
		  <React.Fragment>
		    <span
		      className="code-line"
		      dangerouslySetInnerHTML={
		        {
		          "__html": "<span>}</span>",
		        }
		      }
		    />
		  </React.Fragment>,
		]
	`);
	});

	it("handles empty hast tree", () => {
		const hastTree = {
			children: [],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(0);
	});

	it("handles hast tree without children", () => {
		const hastTree = {};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(0);
	});

	it("generates unique keys for each line", () => {
		const hastTree = {
			children: [
				{
					type: "text",
					value: "line1\nline2\nline3",
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchInlineSnapshot(`
		<React.Fragment>
		  <span
		    className="code-line"
		    dangerouslySetInnerHTML={
		      {
		        "__html": "<span>line1</span>",
		      }
		    }
		  />
		  

		</React.Fragment>
	`);
		expect(result[1]).toMatchInlineSnapshot(`
		<React.Fragment>
		  <span
		    className="code-line"
		    dangerouslySetInnerHTML={
		      {
		        "__html": "<span>line2</span>",
		      }
		    }
		  />
		  

		</React.Fragment>
	`);
		expect(result[2]).toMatchInlineSnapshot(`
		<React.Fragment>
		  <span
		    className="code-line"
		    dangerouslySetInnerHTML={
		      {
		        "__html": "<span>line3</span>",
		      }
		    }
		  />
		</React.Fragment>
	`);
	});

	it("handles complex nested structure with multiple line breaks", () => {
		const hastTree = {
			children: [
				{
					type: "element",
					tagName: "div",
					properties: { className: "code-block" },
					children: [
						{
							type: "text",
							value: "first\nsecond",
						},
						{
							type: "element",
							tagName: "br",
							properties: {},
							children: [],
						},
						{
							type: "text",
							value: "\nthird",
						},
					],
				},
			],
		};

		const result = splitCodeIntoLines(hastTree);

		expect(result).toMatchInlineSnapshot(`
		[
		  <React.Fragment>
		    <span
		      className="code-line"
		      dangerouslySetInnerHTML={
		        {
		          "__html": "<div class="code-block">first</div>",
		        }
		      }
		    />
		    

		  </React.Fragment>,
		  <React.Fragment>
		    <span
		      className="code-line"
		      dangerouslySetInnerHTML={
		        {
		          "__html": "<div class="code-block"><br>second</br></div>",
		        }
		      }
		    />
		    

		  </React.Fragment>,
		  <React.Fragment>
		    <span
		      className="code-line"
		      dangerouslySetInnerHTML={
		        {
		          "__html": "<span><div class="code-block">third</div></span>",
		        }
		      }
		    />
		  </React.Fragment>,
		]
	`);
	});
});
