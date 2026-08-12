import type { CommandTree } from "@app/commands";
import { GRAMAX_DIRECTORY } from "@app/config/const";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article, ArticleProps } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import ArticleProvider from "@ext/articleProvider/logic/ArticleProvider";
import { AgentArticleParser, MarkdownDocumentParser } from "../mcp/parser";

const SYSTEM_PROMPT_PATH = new Path(["agent", "system-prompt.md"]);
const AGENT_SKILLS_DIR = new Path(["agent", "skills"]);

export type AgentSkill = {
	name: string;
	description: string;
	content: string;
};

declare module "@ext/articleProvider/logic/ArticleProvider" {
	export enum ArticleProviders {
		agentSkill = "agentSkill",
	}
}

export default class AgentResourcesProvider extends ArticleProvider {
	constructor(fp: FileProvider, fs: FileStructure, catalog: Catalog) {
		super(fp, fs, catalog, AGENT_SKILLS_DIR);

		fs.events.on("catalog-read", async () => {
			await this.readArticles();
		});
	}

	public async getSkills(app: Application, ctx: Context, commands: CommandTree): Promise<AgentSkill[]> {
		const articles = await this.getItems<Article<ArticleProps>>(true);
		const skills: AgentSkill[] = [];
		for (const article of articles) {
			skills.push(await this._mapArticleToAgentSkill(app, ctx, commands, article));
		}
		return skills;
	}

	public async getSkillByName(
		app: Application,
		ctx: Context,
		commands: CommandTree,
		name: string,
	): Promise<AgentSkill | null> {
		const articles = await this.getItems<Article<ArticleProps>>(true);
		const article = articles.find((item) => item.props.title === name);
		if (!article) return null;
		return this._mapArticleToAgentSkill(app, ctx, commands, article);
	}

	public async getSystemPrompt(): Promise<string | null> {
		const promptPath = this._catalog.basePath.join(new Path([GRAMAX_DIRECTORY, SYSTEM_PROMPT_PATH.value]));
		if (!(await this._fp.exists(promptPath))) return null;

		const markdown = await this._fp.read(promptPath);
		const { content } = this._fs.parseMarkdown(markdown);
		const prompt = content.trim();
		return prompt || null;
	}

	private async _mapArticleToAgentSkill(
		app: Application,
		ctx: Context,
		commands: CommandTree,
		article: Article<ArticleProps>,
	): Promise<AgentSkill> {
		const body = (await article.getContent()).trim();
		const { firstParagraph } = MarkdownDocumentParser.splitFirstParagraph(body);
		const catalog = this._catalog.ctx(ctx);
		const parser = await AgentArticleParser.open(app, ctx, commands, catalog, article);

		return {
			name: article.props.title,
			description: firstParagraph,
			content: await parser.getMarkdownForAgent(),
		};
	}
}
