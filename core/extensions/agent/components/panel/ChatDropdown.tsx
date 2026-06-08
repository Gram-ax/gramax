import DateUtils from "@core-ui/utils/dateUtils";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import type { SessionTabItem } from "./ChatHeader";

type ChatDropdownProps = {
	sessions: SessionTabItem[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onClose: (id: string) => void;
	onNew: () => void;
};

export const ChatDropdown = ({ sessions, activeId, onSelect, onClose, onNew }: ChatDropdownProps) => {
	return (
		<div className="flex items-center gap-1">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<IconButton className="p-1" icon="history" iconClassName="size-3.5" size="xs" variant="ghost" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-64 max-h-[300px] overflow-y-auto">
					<DropdownMenuRadioGroup
						indicatorIconPosition="start"
						onValueChange={(val) => onSelect(val)}
						value={activeId}
					>
						{sessions.length === 0 ? (
							<div className="p-2 text-sm text-muted-foreground text-center">
								{t("agent.history.empty")}
							</div>
						) : (
							sessions.map(({ id, createdAt }) => (
								<DropdownMenuRadioItem
									className="flex items-center justify-start group cursor-pointer"
									onClick={() => onSelect(id)}
									value={id}
								>
									<div className="flex justify-between w-full">
										<span className="truncate">
											{createdAt
												? DateUtils.getDateViewModel(createdAt)
												: t("agent.history.new-chat")}
										</span>
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
									</div>
								</DropdownMenuRadioItem>
							))
						)}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<IconButton
				className="p-1"
				icon="squarePen"
				iconClassName="size-3.5"
				onClick={() => onNew()}
				size="xs"
				variant="ghost"
			/>
		</div>
	);
};
