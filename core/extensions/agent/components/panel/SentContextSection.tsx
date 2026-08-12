import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { downloadFile } from "@core-ui/downloadResource";
import { useApi } from "@core-ui/hooks/useApi";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Label } from "@ui-kit/Label";
import { Loader } from "@ui-kit/Loader";
import { useCallback, useEffect, useState } from "react";
import { AgentContextViewer } from "./AgentContextViewer";

const CONTEXT_OPTS = { consumeError: true } as const;

const SECTION_BOX_CLASSES =
	"w-full rounded-lg border border-secondary-border bg-secondary-bg px-3 py-2.5 shadow-soft-sm outline-none transition-colors lg:py-2 font-sans text-sm text-primary-fg min-h-14";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; json: string };

type Props = { sessionId: string | null };

export const SentContextSection = ({ sessionId }: Props) => {
	const [state, setState] = useState<State>({ kind: "loading" });

	const { call: callContext } = useApi<{ messages: unknown[] }>({
		url: (api) => api.getAgentSessionContextUrl(sessionId ?? ""),
		opts: CONTEXT_OPTS,
	});

	const loadContext = useCallback(async () => {
		if (!sessionId) {
			setState({ kind: "error" });
			return;
		}
		setState({ kind: "loading" });
		try {
			const body = await callContext();
			if (!body) {
				setState({ kind: "error" });
				return;
			}
			const json = JSON.stringify(body.messages ?? [], null, 2);
			setState({ kind: "ready", json });
		} catch {
			setState({ kind: "error" });
		}
	}, [sessionId, callContext]);

	useEffect(() => {
		void loadContext();
	}, [loadContext]);

	return <ContentBlock label={t("agent.usage.modal.sent-context")} onRetry={loadContext} state={state} />;
};

interface ContentBlockProps {
	label: string;
	state: State;
	onRetry: () => void;
}

const ContentBlock = ({ label, state, onRetry }: ContentBlockProps) => {
	if (state.kind === "loading") {
		return (
			<div className="space-y-1">
				<Label>{label}</Label>
				<div className={`${SECTION_BOX_CLASSES} flex items-center justify-center`}>
					<Loader size="sm" />
					<span className="ml-2 text-sm text-muted-foreground">{t("agent.usage.modal.context-loading")}</span>
				</div>
			</div>
		);
	}

	if (state.kind === "error") {
		return (
			<div className="space-y-1">
				<Label>{label}</Label>
				<div className={`${SECTION_BOX_CLASSES} flex flex-col items-center justify-center gap-2`}>
					<span className="text-sm text-destructive">{t("agent.usage.modal.context-error")}</span>
					<Button onClick={onRetry} size="sm" variant="outline">
						{t("agent.usage.modal.context-retry")}
					</Button>
				</div>
			</div>
		);
	}

	const handleDownload = () => {
		downloadFile(state.json, MimeTypes.json, "agent-context.json");
	};

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between gap-2">
				<Label>{label}</Label>
				<div className="flex items-center gap-1.5">
					<Button
						className="h-6 gap-1.5 px-2"
						onClick={handleDownload}
						size="xs"
						startIcon="download"
						variant="outline"
					>
						{t("download")}
					</Button>
				</div>
			</div>
			<div className={`${SECTION_BOX_CLASSES} h-[50vh] overflow-auto`}>
				<AgentContextViewer json={state.json} />
			</div>
		</div>
	);
};
