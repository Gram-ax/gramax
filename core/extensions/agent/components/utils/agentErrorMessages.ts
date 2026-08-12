import t from "@ext/localization/locale/translate";
import { AgentErrorType } from "../../core/agentError";

export const getLocalizedAgentErrorTypeMessage = (errorType: AgentErrorType): string => {
	switch (errorType) {
		case AgentErrorType.Unauthorized:
			return t("agent.error-type.unauthorized");
		case AgentErrorType.PaymentRequired:
			return t("agent.error-type.payment_required");
		case AgentErrorType.MaxStepsExceeded:
			return t("agent.error-type.max_steps_exceeded");
		case AgentErrorType.NetworkError:
			return t("agent.error-type.network_error");
		case AgentErrorType.Unexpected:
			return t("agent.error-type.unexpected");
		default:
			return t("agent.error-type.unexpected");
	}
};
