export async function mermaidExtractText(definition: string): Promise<string[]> {
	const mermaidParser = await import("@ics/modulith-mermaid-parse");
	const parsed = mermaidParser.parse(definition);
	const result: string[] = [];
	type SubgraphNode = { label: string; children: SubgraphNode[] };

	switch (parsed.type) {
		case "flowchart":
		case "state": {
			for (const node of parsed.nodes.values()) {
				pushClean(result, node.label);
			}
			for (const edge of parsed.edges) {
				pushClean(result, edge.label);
			}
			const walkSubgraphs = (subgraphs: SubgraphNode[]) => {
				for (const subgraph of subgraphs) {
					pushClean(result, subgraph.label);
					walkSubgraphs(subgraph.children);
				}
			};
			walkSubgraphs(parsed.subgraphs as SubgraphNode[]);
			break;
		}
		case "sequence": {
			for (const actor of parsed.actors) {
				pushClean(result, actor.label);
			}
			for (const message of parsed.messages) {
				pushClean(result, message.label);
			}
			for (const block of parsed.blocks) {
				pushClean(result, block.label);
				for (const divider of block.dividers) {
					pushClean(result, divider.label);
				}
			}
			for (const note of parsed.notes) {
				pushClean(result, note.text);
			}
			break;
		}
		case "class": {
			for (const classNode of parsed.classes) {
				pushClean(result, classNode.label);
				pushClean(result, classNode.annotation);
				for (const attribute of classNode.attributes) {
					pushClean(result, attribute.name);
					pushClean(result, attribute.type);
					pushClean(result, attribute.params);
				}
				for (const method of classNode.methods) {
					pushClean(result, method.name);
					pushClean(result, method.type);
					pushClean(result, method.params);
				}
			}
			for (const relation of parsed.relationships) {
				pushClean(result, relation.label);
				pushClean(result, relation.fromCardinality);
				pushClean(result, relation.toCardinality);
			}
			for (const namespace of parsed.namespaces) {
				pushClean(result, namespace.name);
			}
			break;
		}
		case "er": {
			for (const entity of parsed.entities) {
				pushClean(result, entity.label);
				for (const attribute of entity.attributes) {
					pushClean(result, attribute.name);
					pushClean(result, attribute.type);
					pushClean(result, attribute.comment);
					for (const key of attribute.keys) {
						pushClean(result, key);
					}
				}
			}
			for (const relation of parsed.relationships) {
				pushClean(result, relation.label);
			}
			break;
		}
		case "xychart": {
			pushClean(result, parsed.title);
			pushClean(result, parsed.xAxis.title);
			pushClean(result, parsed.yAxis.title);
			for (const category of parsed.xAxis.categories ?? []) {
				pushClean(result, category);
			}
			break;
		}
	}

	return result;
}

function pushClean(result: string[], value?: string) {
	if (!value) {
		return;
	}

	const cleaned = cleanupText(value);
	if (!cleaned) {
		return;
	}

	result.push(cleaned);
}

function cleanupText(input: string): string {
	const withoutTags = input.replace(/<[^>]+>/g, " ");
	const withoutEntities = withoutTags
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'");

	return withoutEntities.replace(/\s+/g, " ").trim();
}
