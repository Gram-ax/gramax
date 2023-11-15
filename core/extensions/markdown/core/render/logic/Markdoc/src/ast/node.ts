import transformer from "../transformer";
import type {
	AstType,
	Config,
	Location,
	RenderableTreeNode,
	RenderableTreeNodes,
	Schema,
	ValidationError,
} from "../types";
import { resolve } from "./base";

export default class Node implements AstType {
	readonly $$mdtype = "Node";

	attributes: Record<string, any>;
	children: Node[];
	errors: ValidationError[] = [];
	lines: number[] = [];
	type: string;
	tag?: string;

	inline = false;
	location?: Location;

	constructor(type = "node", attributes: Record<string, any> = {}, children: Node[] = [], tag?: string) {
		this.attributes = attributes;
		this.children = children;
		this.type = type;
		this.tag = tag;
	}

	*walk(): Generator<Node, void, unknown> {
		for (const child of this.children) {
			yield child;
			yield* child.walk();
		}
	}

	push(node: Node) {
		this.children.push(node);
	}

	resolve(config: Config = {}): Node {
		return Object.assign(new Node(), this, {
			children: this.children.map((child) => child.resolve(config)),
			attributes: resolve(this.attributes, config),
		});
	}

	findSchema(config: Config = {}): Schema | undefined {
		return transformer.findSchema(this, config);
	}

	transformAttributes(config: Config = {}) {
		return transformer.attributes(this, config);
	}

	async transformChildren(config: Config): Promise<RenderableTreeNode[]> {
		return await transformer.children(this, config);
	}

	async transform(config: Config): Promise<RenderableTreeNodes> {
		return await transformer.node(this, config);
	}
}
