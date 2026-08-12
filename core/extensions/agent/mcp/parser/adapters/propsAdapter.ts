import assert from "assert";
import matter from "gray-matter";
import * as yaml from "js-yaml";
import type { ArticleAdapter, ArticleAdapterContext } from "./adapter";

export type AgentDocumentProps = Record<string, unknown>;

const EDITABLE_PROPS = new Set(["title", "order", "properties"]);

export class PropsAdapter implements ArticleAdapter {
	async expandToAgentView(content: string, context: ArticleAdapterContext): Promise<string> {
		const props = context.item.props as AgentDocumentProps;
		const publicProps = Object.fromEntries(
			Object.entries(props).filter(([key]) => {
				if (!EDITABLE_PROPS.has(key)) return false;
				return true;
			}),
		);
		const serializedProps = yaml.dump(publicProps, { quotingType: '"' });
		if (!serializedProps.trim()) return content;
		return `---\n${serializedProps}---\n${content}`;
	}

	async applyAgentViewToStorage(agentMarkdown: string, context: ArticleAdapterContext): Promise<string> {
		const { props, content } = PropsAdapter._splitAgentView(agentMarkdown);
		const ru = context.app.resourceUpdaterFactory.withContext(context.catalog.ctx)(context.catalog);
		const { order, ...restProps } = props;
		if (order !== undefined) {
			assert(typeof order === "number" && Number.isFinite(order), "order must be a finite number");
			await context.item.setOrder(order);
			await context.item.parent.sortItems("no-sort");
		}
		await context.item.updateProps({ ...restProps, logicPath: context.item.logicPath }, ru, context.catalog.deref);
		return content;
	}

	private static _splitAgentView(markdown: string): { props: AgentDocumentProps; content: string } {
		let parsed: matter.GrayMatterFile<string>;
		try {
			parsed = matter(markdown, {});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			assert(false, `Invalid frontmatter: ${msg}`);
		}
		const props = Object.fromEntries(Object.entries(parsed.data).filter(([key]) => EDITABLE_PROPS.has(key)));
		return { props, content: parsed.content };
	}
}
