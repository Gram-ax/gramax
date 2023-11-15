import Ast from "./src/ast/index";
import Node from "./src/ast/node";
import Tag from "./src/ast/tag";
import functions from "./src/functions/index";
import parser from "./src/parser";
import renderers from "./src/renderers/index";
import * as nodes from "./src/schema";
import { truthy } from "./src/tags/conditional";
import tags from "./src/tags/index";
import Tokenizer from "./src/tokenizer";
import transformer from "./src/transformer";
import transforms from "./src/transforms/index";
import { parseTags } from "./src/utils";
import validator from "./src/validator";

import MarkdownIt from "markdown-it";
import type { Config, RenderableTreeNode, Token, ValidateError } from "./src/types";

export * from "./src/types";

const tokenizer = new Tokenizer({ linkify: true });

function mergeConfig(config: Config = {}): Config {
	return {
		...config,
		tags: {
			...tags,
			...config.tags,
		},
		nodes: {
			...nodes,
			...config.nodes,
		},
		functions: {
			...functions,
			...config.functions,
		},
	};
}

const plugins: string[] = [];
export function use(plugin: MarkdownIt.PluginWithParams, name: string, ...params: any[]): MarkdownIt {
	if (!plugins.includes(name)) plugins.push(name);
	else return null;
	return tokenizer.use(plugin, ...params);
}

export function parse(content: string | Token[], file?: string): Node {
	if (typeof content === "string") content = tokenizer.tokenize(content);
	return parser(content, file);
}
export function renderMarkdownItHtml(content: string): string {
	return tokenizer.renderToHtml(content);
}

export function resolve<C extends Config = Config>(content: Node, config: C): Node;
export function resolve<C extends Config = Config>(content: Node[], config: C): Node[];
export function resolve<C extends Config = Config>(content: any, config: C): any {
	if (Array.isArray(content)) return content.flatMap((child) => child.resolve(config));

	return content.resolve(config);
}

export function transform<C extends Config = Config>(node: Node, config?: C): Promise<RenderableTreeNode>;
export function transform<C extends Config = Config>(nodes: Node[], config?: C): Promise<RenderableTreeNode[]>;
export async function transform<C extends Config = Config>(nodes: any, options?: C) {
	const config = mergeConfig(options);
	const content = resolve(nodes, config);

	if (Array.isArray(content)) return (await Promise.all(content.map((child) => child.transform(config)))).flat();
	return await content.transform(config);
}

export function validate<C extends Config = Config>(content: Node, options?: C): ValidateError[] {
	const config = mergeConfig(options);

	const output = [];
	for (const node of [content, ...content.walk()]) {
		const { type, lines, location } = node;
		const errors = validator(node, config);

		for (const error of errors) output.push({ type, lines, location, error });
	}

	return output;
}

export function createElement(name: string | { key?: string | number }, attributes = {}, ...children: any[]) {
	return { name, attributes, children };
}

export default {
	nodes,
	tags,
	functions,
	renderers,
	transforms,
	tokenizer,
	Ast,
	Tag,
	Tokenizer,
	parseTags,
	transformer,
	validator,
	parse,
	renderMarkdownItHtml,
	transform,
	validate,
	createElement,
	use,
	truthy,
};

export {
	Ast,
	Tag,
	Tokenizer,
	functions,
	nodes,
	parseTags,
	renderers,
	tags,
	transformer,
	transforms,
	truthy,
	validator,
};
