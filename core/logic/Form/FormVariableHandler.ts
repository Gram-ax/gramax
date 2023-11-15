import { JSONSchema7 } from "json-schema";

export default class FormVariableHandler {
	private _schemaBefore: JSONSchema7;
	constructor(
		private _schema: JSONSchema7,
		private _variables: { [variable: string]: string },
	) {
		this._schemaBefore = JSON.parse(JSON.stringify(this._schema));
	}

	replaceVars(): void {
		this._replace(this._schema);
	}

	reverseReplace(): void {
		Object.keys(this._schema).forEach((key) => (this._schema[key] = this._schemaBefore[key]));
	}

	private _replace(schema: JSONSchema7) {
		if (!schema || typeof schema !== "object") return;

		if ("title" in schema) schema["title"] = this._replaceStr(schema["title"]);
		if ("format" in schema) schema["format"] = this._replaceStr(schema["format"]);
		if ("description" in schema) schema["description"] = this._replaceStr(schema["description"]);

		for (const value of Object.values(schema)) this._replace(value);
	}

	private _replaceStr(str: string): string {
		for (const [variable, value] of Object.entries(this._variables)) {
			str = str.replaceAll(`$${variable}`, value);
		}
		return str;
	}
}
