import DefaultError from "@ext/errorHandlers/logic/DefaultError";

export enum AgentErrorType {
	Unauthorized = "unauthorized",
	PaymentRequired = "payment_required",
	MaxStepsExceeded = "max_steps_exceeded",
	NetworkError = "network_error",
	Unexpected = "unexpected",
}

export enum AgentWarningType {
	CacheHitZero = "cache_hit_zero",
}

export class AgentError extends DefaultError {
	readonly errorType: AgentErrorType;

	constructor(errorType: AgentErrorType, message: string, cause?: Error) {
		super(message, cause, { errorType });
		this.name = "AgentError";
		this.errorType = errorType;
	}
}

export function isAgentError(error: unknown): error is AgentError {
	return error instanceof AgentError;
}
