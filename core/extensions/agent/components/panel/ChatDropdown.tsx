import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { SessionTabItem } from "../types/chat";

type ChatDropdownProps = {
	sessions: SessionTabItem[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onClose: (id: string) => void;
	onNew: () => void;
};

export const ChatDropdown = ({ sessions, activeId, onSelect, onClose, onNew }: ChatDropdownProps) => {
	const visibleSessions = sessions.filter((s) => s.hasUserMessage);
	return (
		<div className="flex items-center gap-1">
			<DropdownMenu>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<IconButton
								className="p-1"
								icon="history"
								iconClassName="size-3.5"
								size="xs"
								variant="ghost"
							/>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent>{t("agent.tooltips.history")}</TooltipContent>
				</Tooltip>
				<DropdownMenuContent
					align="end"
					className="w-72 max-h-[300px] overflow-y-auto"
					onCloseAutoFocus={(e) => e.preventDefault()}
				>
					<DropdownMenuRadioGroup
						indicatorIconPosition="start"
						onValueChange={(val) => onSelect(val)}
						value={activeId}
					>
						{visibleSessions.length === 0 ? (
							<div className="p-2 text-sm text-muted-foreground text-center">
								{t("agent.history.empty")}
							</div>
						) : (
							visibleSessions.map(({ id, title }) => (
								<DropdownMenuRadioItem
									className="flex items-center justify-start group cursor-pointer"
									key={id}
									value={id}
								>
									<div className="flex justify-between flex-1 min-w-0">
										<TextOverflowTooltip className="min-w-0 flex-1">
											{title || t("agent.history.new-chat")}
										</TextOverflowTooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<IconButton
													className="size-5 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
													icon="trash2"
													iconClassName="size-3.5 text-destructive"
													onClick={(e) => {
														e.stopPropagation();
														onClose(id);
													}}
													size="xs"
													variant="text"
												/>
											</TooltipTrigger>
											<TooltipContent>{t("agent.tooltips.delete-session")}</TooltipContent>
										</Tooltip>
									</div>
								</DropdownMenuRadioItem>
							))
						)}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<TooltipIconButton
				className="p-1"
				icon="squarePen"
				iconClassName="size-3.5"
				onClick={() => onNew()}
				size="xs"
				tooltip={t("agent.tooltips.new-chat")}
				variant="ghost"
			/>
		</div>
	);
};
