import { type Healthchecker, type HealthcheckResult, HealthcheckStatus } from "@ext/healthcheck/HealthChecker";
import type { RemoteModulithSearchClient } from "@ext/serach/modulith/search/RemoteModulithSearchClient";

export class RemoteSearchHealthChecker implements Healthchecker {
	readonly name = "ai-server";

	constructor(private readonly _client: RemoteModulithSearchClient) {}

	async check(): Promise<HealthcheckResult> {
		const res = await this._client.healthcheck();
		return {
			status: res.ok === true ? HealthcheckStatus.HEALTHY : HealthcheckStatus.UNHEALTHY,
		};
	}
}
