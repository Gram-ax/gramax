import { setAgentChatIsOpen } from "@ext/agent/components/store/AgentChatIsOpenStore";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { Label } from "@ui-kit/Label";
import { useState } from "react";
import { useApiKey } from "../store/AgentStore";
import { AgentSettingsModal } from "./AgentSettingsModal";
import { ChatDropdown } from "./ChatDropdown";

export type SessionTabItem = {
	id: string;
	createdAt?: number;
};

type Props = {
	sessions: SessionTabItem[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onClose: (id: string) => void;
	onNew: () => void;
	onSaveSettings?: (key: string) => void;
};

export function ChatHeader({ sessions, activeId, onSelect, onClose, onNew, onSaveSettings }: Props) {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const apiKey = useApiKey();

	return (
		<>
			<div className="flex min-h-10 max-w-full min-w-0 items-center gap-0.5 justify-between px-2 pt-2">
				<div className="flex items-center gap-2">
					<Icon icon="wand-sparkles" />
					<Label>{t("agent.panel-name")}</Label>
				</div>
				<div className="flex gap-1">
					<ChatDropdown
						activeId={activeId}
						onClose={onClose}
						onNew={onNew}
						onSelect={onSelect}
						sessions={sessions}
					/>
					<IconButton
						className="p-1"
						icon="settings"
						iconClassName="size-3.5"
						onClick={() => setSettingsOpen(true)}
						size="xs"
						variant="ghost"
					/>
					<IconButton
						className="p-1"
						icon="x"
						iconClassName="size-3.5"
						onClick={() => {
							setAgentChatIsOpen(false);
						}}
						size="xs"
						variant="ghost"
					/>
				</div>
			</div>
			<AgentSettingsModal
				defaultKey={apiKey ?? ""}
				onOpenChange={setSettingsOpen}
				onSave={(key) => onSaveSettings?.(key)}
				open={settingsOpen}
			/>
		</>
	);
}
