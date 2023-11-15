import { JSONSchema7 } from "json-schema";
import FormVariableHandler from "../FormVariableHandler";
import testSchema from "./testData";

const variables = { VAR1: "VALUE1", VAR2: "VALUE2" };
let fvh: FormVariableHandler;
let schema: JSONSchema7;

describe("FormVariableHandler", () => {
	beforeEach(() => {
		schema = JSON.parse(JSON.stringify(testSchema));
		fvh = new FormVariableHandler(schema, variables);
	});
	it("Заменяет переменные на их значения", () => {
		fvh.replaceVars();
		expect(schema.title).toBe("<p>VALUE1 Title VALUE2</p>");
		expect(schema.properties.varsTest).toEqual({
			title: "<p>title VALUE1 title2 title3 VALUE2 title4</p>",
			format: "format VALUE1 VALUE2",
			description: "<p>VALUE1 VALUE2 description</p>",
			type: "string",
		});
	});
	it("Заменяет значения переменных обратно на переменные", () => {
		fvh.replaceVars();
		fvh.reverseReplace();
		expect(schema.title).toBe("<p>$VAR1 Title $VAR2</p>");
		expect(schema.properties.varsTest).toEqual({
			title: "<p>title $VAR1 title2 title3 $VAR2 title4</p>",
			format: "format $VAR1 $VAR2",
			description: "<p>$VAR1 $VAR2 description</p>",
			type: "string",
		});
	});
});
