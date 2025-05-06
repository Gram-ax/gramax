import type AstFunction from "../ast/function";
import type AstVariable from "../ast/variable";
import { Token } from "../types";

type astTypes = {
	Variable?: typeof AstVariable;
	Function?: typeof AstFunction;
};

export function parse(input: string, astTypes?: astTypes): Token;

type PegLocation = {
	offset: number;
	line: number;
	column: number;
};

export class SyntaxError extends Error {
	location: {
		start: PegLocation;
		end: PegLocation;
	};
}
