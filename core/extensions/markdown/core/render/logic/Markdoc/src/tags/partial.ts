import type { Config, Node, Schema } from "../types";

export const partial: Schema = {
	selfClosing: true,
	attributes: {
		file: { type: String, render: false, required: true },
		variables: { type: Object, render: false },
	},

	async transform(node: Node, config: Config) {
		const { partials = {} } = config;
		const { file, variables } = node.attributes;
		const partial: Node | Node[] = partials[file];

		if (!partial) return null;

		const scopedConfig = {
			...config,
			variables: {
				...config.variables,
				...variables,
				["$$partial:filename"]: file,
			},
		};

		const transformChildren = async (part: Node) =>
			await part.resolve(scopedConfig).transformChildren(scopedConfig);

		return Array.isArray(partial)
			? (await Promise.all(partial.map(async (n) => await transformChildren(n)))).flat()
			: await transformChildren(partial);
	},
};
