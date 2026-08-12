import InputFile from "@components/Atoms/InputFile";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import type { AgentSkill } from "@ext/agent/core/agentResourcesProvider";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuEmptyItem,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ChangeEventHandler, useState } from "react";

type SkillsListResponse = { skills: AgentSkill[] };

type Props = {
	catalogName: string | null;
	selectedSkillName: string | null;
	onSkillChange: (name: string | null) => void;
	onFileChange: ChangeEventHandler<HTMLInputElement>;
};

const ChatToolsMenu = ({ catalogName, selectedSkillName, onSkillChange, onFileChange }: Props) => {
	const [open, setOpen] = useState(false);
	const {
		data: skills,
		status,
		call: refetchSkills,
	} = useApi<SkillsListResponse, AgentSkill[]>({
		url: (api) => api.getAgentSkillsListUrl(catalogName),
		map: (data) => data?.skills ?? [],
		opts: { consumeError: true },
	});

	const skillList = skills ?? [];
	const isLoading = status === RequestStatus.Init || status === RequestStatus.Loading;

	const handleFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		setOpen(false);
		onFileChange(e);
	};

	return (
		<DropdownMenu
			onOpenChange={(next) => {
				if (next) void refetchSkills();
				setOpen(next);
			}}
			open={open}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<IconButton
							aria-label={t("agent.tooltips.add")}
							className="rounded-full p-1"
							icon="plus"
							iconClassName="size-4"
							size="xs"
							variant="ghost"
						/>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>{t("agent.tooltips.add")}</TooltipContent>
			</Tooltip>
			<DropdownMenuContent align="start" className="w-56">
				<InputFile className="w-full" onChange={handleFileChange}>
					<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
						<Icon className="size-4" icon="paperclip" />
						{t("agent.skills.attach-file")}
					</DropdownMenuItem>
				</InputFile>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>{t("agent.skills.name")}</DropdownMenuLabel>
				{skillList.length === 0 && isLoading ? (
					<DropdownMenuItem disabled>{t("agent.skills.loading")}</DropdownMenuItem>
				) : skillList.length === 0 ? (
					<DropdownMenuEmptyItem>{t("agent.skills.no-skills")}</DropdownMenuEmptyItem>
				) : (
					<DropdownMenuRadioGroup value={selectedSkillName ?? ""}>
						{skillList.map((skill) => {
							const isSelected = selectedSkillName === skill.name;
							return (
								<DropdownMenuRadioItem
									key={skill.name}
									onSelect={(e) => {
										e.preventDefault();
										onSkillChange(isSelected ? null : skill.name);
									}}
									value={skill.name}
								>
									<TextOverflowTooltip className="truncate whitespace-nowrap">
										{skill.name ?? t("agent.skills.unnamed-skill")}
									</TextOverflowTooltip>
								</DropdownMenuRadioItem>
							);
						})}
					</DropdownMenuRadioGroup>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export { ChatToolsMenu };
