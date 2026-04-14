import { initBackendModules } from "@app/resolveModule/backend";
import { extractTextsMermaid } from "@ext/serach/modulith/parsing/extractTextsMermaid";
import { describe, expect, it } from "@jest/globals";

beforeAll(async () => {
	await initBackendModules();
});

interface TestCase {
	name: string;
	schema: string;
	expected: string[];
}

describe("extractTextsMermaid", () => {
	const cases: TestCase[] = [
		{
			name: "flowchart: vertices + edge label",
			schema: `
graph TD
    A[Enter Chart Definition] --> B(Preview)
    B --> C{decide}
    C --> D[Keep]
    C --> E[Edit Definition]
    E --> B
    D --> F[Save <font color='red'><b>Image</b></font> and Code]
    F --> B`,
			expected: ["Enter Chart Definition", "Preview", "decide", "Keep", "Edit Definition", "Save Image and Code"],
		},
		{
			name: "sequenceDiagram: participants + message",
			schema: `
sequenceDiagram
  participant Alice
  participant Bob
  Alice->>Bob: Hello`,
			expected: ["Alice", "Bob", "Hello"],
		},
		{
			name: "flowchart LR: quoted labels and edge text",
			schema: `
flowchart LR
  A["Start process"] -->|"validate input"| B{"Is valid?"}
  B -->|yes| C["Continue"]
  B -->|no| D["Show error"]`,
			expected: ["Start process", "Is valid?", "Continue", "Show error", "validate input", "yes", "no"],
		},
		{
			name: "keeps duplicate labels when diagram contains duplicates",
			schema: `
flowchart LR
  A[Repeat] --> B[Repeat]
  B -->|Repeat| C[Done]`,
			expected: ["Repeat", "Repeat", "Repeat", "Done"],
		},
		{
			name: "classDiagram: classes and relation labels",
			schema: `
classDiagram
  class Animal {
    +String name
    +makeSound()
  }
  class Dog
  Animal <|-- Dog : inherits`,
			expected: ["Animal", "Dog", "String", "name", "makeSound", "inherits"],
		},
		{
			name: "stateDiagram-v2: states and transitions",
			schema: `
stateDiagram-v2
  [*] --> Idle
  Idle --> Processing: start
  Processing --> Done: complete
  Processing --> Error: fail`,
			expected: ["Idle", "Processing", "Done", "Error", "start", "complete", "fail"],
		},
		{
			name: "erDiagram: entities and relationship label",
			schema: `
erDiagram
  CUSTOMER ||--o{ ORDER : places
  CUSTOMER {
    string name
  }
  ORDER {
    string number
  }`,
			expected: ["CUSTOMER", "ORDER", "places", "string", "string", "name", "number"],
		},
	];

	for (const tc of cases) {
		it(tc.name, async () => {
			const actual = await extractTextsMermaid(tc.schema);
			expect(actual.slice().sort()).toEqual(tc.expected.slice().sort());
		});
	}
});
