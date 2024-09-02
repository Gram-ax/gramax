const langs = [
	"1C",
	"Arduino",
	"Bash",
	"C",
	"C++",
	"C#",
	"CSS",
	"cURL",
	"Diff",
	"Go",
	"GraphQL",
	"Gherkin",
	"HTML",
	"INI",
	"Java",
	"JavaScript",
	"JSON",
	"Kotlin",
	"Less",
	"Lua",
	"Makefile",
	"Markdown",
	"Objective-C",
	"Perl",
	"PHP",
	"PHP Template",
	"Plaintext",
	"Python",
	"Python REPL",
	"R",
	"Ruby",
	"Rust",
	"SCSS",
	"Shell",
	"SQL",
	"Swift",
	"TypeScript",
	"VB.NET",
	"WASM",
	"YAML",
	"XML",
];

const sortByFirstLetter = (arr: string[]): string[] =>
	arr.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

type LangList = any;

const Languages = sortByFirstLetter(langs);

export { Languages };

export default LangList;
