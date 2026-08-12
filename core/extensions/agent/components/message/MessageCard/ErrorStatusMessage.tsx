import { getLocalizedAgentErrorTypeMessage } from "@ext/agent/components/utils/agentErrorMessages";
import { AgentErrorType } from "@ext/agent/core/agentError";
import { ErrorMessage } from "@ext/git/actions/RepositoryBroken/TechnicalDetails";
import t from "@ext/localization/locale/translate";
import type { Ref } from "react";

export interface ErrorStatusMessageProps {
	statusText: string;
	errorType?: AgentErrorType;
	responseRef?: Ref<HTMLDivElement>;
}

export const ErrorStatusMessage = ({ statusText, errorType, responseRef }: ErrorStatusMessageProps) => {
	const resolvedType = errorType ?? AgentErrorType.Unexpected;
	const detail = statusText.trim();

	const headline =
		resolvedType === AgentErrorType.Unexpected && detail.length > 0
			? t("agent.error-type.unexpected-with-message").replace("{{message}}", detail)
			: getLocalizedAgentErrorTypeMessage(resolvedType);

	return (
		<div className="flex w-full min-w-0 items-center" ref={responseRef}>
			<ErrorMessage className="text-status-error text-sm">{headline}</ErrorMessage>
		</div>
	);
};
