import { Level, trace } from "@ext/loggers/opentelemetry";
import { type Healthchecker, type HealthcheckResult, HealthcheckStatus } from "./HealthChecker";

export interface AggregatedHealthResult {
	status: HealthcheckStatus;
	checks: Record<string, HealthcheckResult & { durationMs?: number }>;
}

export class HealthcheckRegistry {
	private _results: { name: string; res: HealthcheckResult }[] = [];
	private readonly _checkers: Healthchecker[] = [];

	saveResult(result: { name: string; res: HealthcheckResult }) {
		this._results.push(result);
	}

	checkResultByIncludesName(includesName: string): { name: string; res: HealthcheckResult } {
		const index = this._results.findIndex(({ name: resultName }) => resultName.includes(includesName));
		if (index === -1) return;
		return { name: this._results[index].name, res: this._results[index].res };
	}

	register(checker: Healthchecker): void {
		this._checkers.push(checker);
	}

	@trace({ level: Level.Important })
	async checkAll(): Promise<AggregatedHealthResult> {
		const results: { name: string; result: HealthcheckResult & { durationMs?: number } }[] = await Promise.all(
			this._checkers.map(async (checker) => {
				const start = performance.now();
				try {
					const result = await checker.check();
					return {
						name: checker.name,
						result: { ...result, durationMs: performance.now() - start },
						timestamp: new Date(),
					};
				} catch (err) {
					return {
						name: checker.name,
						result: {
							status: HealthcheckStatus.UNHEALTHY,
							message: err instanceof Error ? err.message : String(err),
							durationMs: performance.now() - start,
						},
					};
				}
			}),
		);
		const savedResults = this._results.map(({ name, res }) => {
			return { name, result: { ...res }, timestamp: res.timestamp };
		});
		results.push(...savedResults);

		const checks: AggregatedHealthResult["checks"] = {};
		let overallHealthy = true;
		for (const { name, result } of results) {
			checks[name] = result;
			if (result.status === HealthcheckStatus.UNHEALTHY) overallHealthy = false;
		}

		return { status: overallHealthy ? HealthcheckStatus.HEALTHY : HealthcheckStatus.UNHEALTHY, checks };
	}
}
