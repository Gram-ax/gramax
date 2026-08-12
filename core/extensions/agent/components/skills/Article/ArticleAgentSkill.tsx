import AgentSkillService from "@ext/agent/components/skills/AgentSkillService";
import BaseArticleView from "@ext/articleProvider/components/BaseArticleView";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import type { JSONContent } from "@tiptap/core";

interface ArticleAgentSkillProps {
	item: ProviderItemProps;
}

const ArticleAgentSkill = ({ item }: ArticleAgentSkillProps) => {
	const { skills } = AgentSkillService.value;

	const updateContent = (id: string, _content: JSONContent, title: string) => {
		const skill = skills.get(id);
		if (!skill) return;

		if (skill.title !== title) {
			skill.title = title.trim();
		}

		AgentSkillService.setItems(Array.from(skills.values()));
	};

	return (
		<BaseArticleView
			item={item}
			onCloseClick={() => AgentSkillService.closeItem()}
			onUpdate={updateContent}
			providerType="agentSkill"
		/>
	);
};

export default ArticleAgentSkill;
