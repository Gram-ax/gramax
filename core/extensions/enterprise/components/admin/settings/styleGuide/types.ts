type ForType = "heading" | "plainText";
//TODO_RM: shall think about reverse support for old format forTypes
type ForTypeObject = { code: ForType };

type ExampleRunResult = {
	result: { suggestions: { text: string; id: number }[] };
	statusCode: "success" | "failed";
	dateTimeIso8601: string;
};

type RuleExample = {
	id?: string;
	isCorrect: boolean;
	text: string;
	runResult?: ExampleRunResult;
};

type LgtRule = {
	guid: string;
	xml: string;
	forTypes: ForTypeObject[];
	enabled?: boolean;
	testCases: RuleExample[];
};

type LlmRule = {
	guid: string;
	name: string;
	llmPrompt: string;
	enabled?: boolean;
	testCases: RuleExample[];
	forTypes: ForTypeObject[];
};

type StyleGuide = {
	enabled: boolean;
	lgt: {
		rules: LgtRule[];
	};
	llm?: {
		rules: LlmRule[];
	};
	systemPrompt?: { text: string };
};

export default StyleGuide;
export type { ExampleRunResult, ForType, ForTypeObject, LgtRule, LlmRule, RuleExample };
