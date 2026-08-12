import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import generateUniqueID from "@core/utils/generateUniqueID";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useDeferApi } from "@core-ui/hooks/useApi";
import AgentSkillService from "@ext/agent/components/skills/AgentSkillService";
import ItemList from "@ext/articleProvider/components/ItemList";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { Button } from "@ui-kit/Button";
import { useCallback, useEffect, useRef, useState } from "react";

const LIST_OPTS = { consumeError: true } as const;

interface AgentSkillTabProps {
	show: boolean;
}

const AgentSkillTab = ({ show }: AgentSkillTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedID, skills } = AgentSkillService.value;

	const { call: callList } = useDeferApi<ProviderItemProps[]>({
		opts: LIST_OPTS,
	});

	const { call: callCreate } = useDeferApi<void>({
		opts: LIST_OPTS,
	});

	const fetchSkills = useCallback(async () => {
		if (!apiUrlCreator) return;

		const data = await callList({
			url: apiUrlCreator.getArticleListInGramaxDir("agentSkill"),
		});
		if (data) AgentSkillService.setItems(data);
		return data;
	}, [apiUrlCreator, callList]);

	useEffect(() => {
		if (!show || !apiUrlCreator) return;
		void fetchSkills();
	}, [show, apiUrlCreator, fetchSkills]);

	const addNewSkill = useCallback(async () => {
		if (!apiUrlCreator) return;

		const uniqueID = generateUniqueID();
		await callCreate({
			url: apiUrlCreator.createFileInGramaxDir(uniqueID, "agentSkill"),
		});

		const newSkills = await fetchSkills();
		const skill = newSkills?.find((item) => item.id === uniqueID);
		if (skill) AgentSkillService.openItem(skill);
	}, [apiUrlCreator, callCreate, fetchSkills]);

	useEffect(() => {
		if (!selectedID) return;

		const listener = () => {
			AgentSkillService.closeItem();
		};

		const clickToken = NavigationEvents.on("item-click", listener);
		const createToken = NavigationEvents.on("item-create", listener);
		const deleteToken = NavigationEvents.on("item-delete", listener);

		return () => {
			NavigationEvents.off(clickToken);
			NavigationEvents.off(createToken);
			NavigationEvents.off(deleteToken);
		};
	}, [selectedID]);

	const onDelete = useCallback(
		(id: string) => {
			if (selectedID === id) {
				AgentSkillService.closeItem();
			}

			const newSkills = Array.from(skills.values()).filter((skill) => skill.id !== id);
			AgentSkillService.setItems(newSkills);
		},
		[selectedID, skills],
	);

	const onMarkdownChange = useCallback(
		(id: string) => {
			if (selectedID !== id) return;
			AgentSkillService.openItem(skills.get(id));
		},
		[selectedID, skills],
	);

	const onItemClick = useCallback(
		(id: string) => {
			const skill = skills.get(id);
			if (!skill) return;
			AgentSkillService.openItem(skill);
		},
		[skills],
	);

	return (
		<TabWrapper
			contentHeight={height}
			isTop
			ref={tabWrapperRef}
			show={show}
			title=""
			titleRightExtension={
				<Button className="p-0 h-auto" onClick={addNewSkill} size="sm" startIcon="plus" variant="text">
					{t("agent.skills.new-skill")}
				</Button>
			}
		>
			<ItemList
				confirmDeleteText={t("confirm-agent-skills-delete")}
				items={Array.from(skills.values())}
				noItemsText={t("agent.skills.no-skills")}
				onDelete={onDelete}
				onItemClick={onItemClick}
				onMarkdownChange={onMarkdownChange}
				providerType="agentSkill"
				selectedItemId={selectedID}
				setContentHeight={setHeight}
				show={show}
				tabWrapperRef={tabWrapperRef}
			/>
		</TabWrapper>
	);
};

export default AgentSkillTab;
