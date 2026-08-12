import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { useDeferApi } from "@core-ui/hooks/useApi";
import { useAgentChatVisibility } from "@ext/agent/components/hooks/useAgentChatVisibility";
import { AgentSettingsModal } from "@ext/agent/components/panel/AgentSettingsModal";
import { ChatDropdown } from "@ext/agent/components/panel/ChatDropdown";
import { setAgentChatIsOpen } from "@ext/agent/components/store/AgentChatIsOpenStore";
import { useActiveSessionBrowser } from "@ext/agent/components/store/AgentStore";
import t from "@ext/localization/locale/translate";
import { Icon } from "@ui-kit/Icon";
import { Label } from "@ui-kit/Label";
import { memo, useCallback, useState } from "react";
import { useApiKey } from "../store/AgentStore";
import { useChatHeaderActions } from "../store/ChatStore";

export const ChatHeader = memo(() => {
	const { sessions, activeSessionId, onSelectSession, onCloseTab, onNewSession, onSaveSettings } =
		useChatHeaderActions();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const apiKey = useApiKey();
	const browser = useActiveSessionBrowser();
	const { showGear, showBrowserReveal } = useAgentChatVisibility();
	const { call: callReveal } = useDeferApi({});

	const handleReveal = useCallback(() => {
		if (!activeSessionId) return Promise.resolve();

		return callReveal({
			url: (api) => api.getAgentBrowserRevealUrl(activeSessionId),
			opts: {
				method: Method.POST,
				mime: MimeTypes.json,
				consumeError: true,
			},
		});
	}, [activeSessionId, callReveal]);

	return (
		<>
			<div className="flex min-h-10 max-w-full min-w-0 items-center gap-0.5 justify-between px-4 pt-2">
				<div className="flex items-center gap-2">
					<Icon icon="wand-sparkles" />
					<Label>{t("agent.panel-name")}</Label>
				</div>
				<div className="flex gap-1">
					{showBrowserReveal && browser?.active && (
						<TooltipIconButton
							className="p-1"
							icon="globe"
							iconClassName="size-3.5"
							onClick={() => void handleReveal()}
							size="xs"
							tooltip={t("agent.browser.tooltip")}
							variant="ghost"
						/>
					)}
					<ChatDropdown
						activeId={activeSessionId}
						onClose={onCloseTab}
						onNew={onNewSession}
						onSelect={onSelectSession}
						sessions={sessions}
					/>
					{showGear && (
						<TooltipIconButton
							className="p-1"
							icon="settings"
							iconClassName="size-3.5"
							onClick={() => setSettingsOpen(true)}
							size="xs"
							tooltip={t("agent.tooltips.settings")}
							variant="ghost"
						/>
					)}
					<TooltipIconButton
						className="p-1"
						icon="x"
						iconClassName="size-3.5"
						onClick={() => setAgentChatIsOpen(false)}
						size="xs"
						tooltip={t("agent.tooltips.close")}
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
});
