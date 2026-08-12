export interface HealthcheckResult {
	status: HealthcheckStatus;
	message?: string;
	timestamp?: Date;
}

export enum HealthcheckStatus {
	HEALTHY = "healthy",
	UNHEALTHY = "unhealthy",
}

export interface Healthchecker {
	readonly name: string;
	check(): Promise<HealthcheckResult>;
}
