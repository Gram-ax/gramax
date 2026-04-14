import { initBackendModules } from "@app/resolveModule/backend";
import { extractTextsSvg } from "@ext/serach/modulith/parsing/extractTextsSvg";
import { describe, expect, it } from "@jest/globals";

interface TestCase {
	name: string;
	svg: string;
	expected: string[];
}

beforeAll(async () => {
	await initBackendModules();
});

describe("extractTextsSvg", () => {
	const cases: TestCase[] = [
		{
			name: "extracts content from text and tspan without duplicates",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <text>Title</text>
  <text><tspan>Part</tspan></text>
</svg>`,
			expected: ["Title", "Part"],
		},
		{
			name: "extracts paragraph from foreignObject",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject>
    <p>Embedded paragraph</p>
  </foreignObject>
</svg>`,
			expected: ["Embedded paragraph"],
		},
		{
			name: "skips empty and whitespace-only text nodes",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <text></text>
  <text> </text>
</svg>`,
			expected: [],
		},
		{
			name: "keeps non-empty values when empty nodes are mixed in",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <text></text>
  <text>Visible title</text>
  <foreignObject>
    <p>   </p>
    <span>Visible span</span>
  </foreignObject>
</svg>`,
			expected: ["Visible title", "Visible span"],
		},
		{
			name: "extracts p and span nodes from nested foreignObject structure",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject>
    <div>
      <section>
        <article>
          <p>Level one</p>
          <div>
            <p>Level two</p>
          </div>
          <span>included span</span>
        </article>
      </section>
    </div>
  </foreignObject>
</svg>`,
			expected: ["Level one", "Level two", "included span"],
		},
		{
			name: "preserves line breaks inside text and paragraph nodes",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <text>First line
Second line</text>
  <foreignObject>
    <p>Paragraph line 1
Paragraph line 2</p>
  </foreignObject>
</svg>`,
			expected: ["First line\nSecond line", "Paragraph line 1\nParagraph line 2"],
		},
		{
			name: "extracts text content from nested tspans in document order without duplicate",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <text>
    <tspan>Outer</tspan>
    <tspan><tspan>Inner</tspan></tspan>
  </text>
</svg>`,
			expected: ["Outer\n    Inner"],
		},
		{
			name: "returns empty array when selector nodes are absent",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" />
  <g><circle cx="10" cy="10" r="5" /></g>
</svg>`,
			expected: [],
		},
		{
			name: "does match namespaced xhtml paragraph with current selector",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject>
    <xhtml:div xmlns:xhtml="http://www.w3.org/1999/xhtml">
      <xhtml:p>XHTML paragraph</xhtml:p>
    </xhtml:div>
  </foreignObject>
</svg>`,
			expected: ["XHTML paragraph"],
		},
		{
			name: "keeps identical text from independent nodes",
			svg: `
<svg xmlns="http://www.w3.org/2000/svg">
  <text>Repeat</text>
  <text><tspan>Repeat</tspan></text>
  <foreignObject>
    <span>Repeat</span>
  </foreignObject>
</svg>`,
			expected: ["Repeat", "Repeat", "Repeat"],
		},
		{
			name: "taking only first node of switch node",
			svg: `
<svg><defs /><g><g><g><switch><foreignObject><div><div><div>Interesting</div></div></div></foreignObject><text>Interesting</text></switch></g></g><g><g><switch><foreignObject><div><div><div>Some value here</div></div></div></foreignObject><text>Some value here</text></switch></g></g><g><g><switch><foreignObject><div><div><div>draw io diagram</div></div></div></foreignObject><text>draw io diagram</text></switch></g></g><g><rect /></g><g><g><switch><foreignObject><div><div><div>JUST TEXT</div></div></div></foreignObject><text>JUST TEXT</text></switch></g></g></g><switch><g requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" /><a><text>Text is not SVG - cannot display</text></a></switch></svg>`,
			expected: ["Interesting", "Some value here", "draw io diagram", "JUST TEXT"],
		},
	];

	for (const tc of cases)
		it(tc.name, async () => {
			const actual = await extractTextsSvg(tc.svg);
			expect(actual).toEqual(tc.expected);
		});
});
