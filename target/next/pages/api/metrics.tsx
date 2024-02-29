import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import promClient, { Counter, Histogram, Registry } from "prom-client";
import { ApplyApiMiddleware } from "../../logic/Api/ApplyMiddleware";

const registry = new Registry();
promClient.collectDefaultMetrics({
	register: registry,
	gcDurationBuckets: [0.1, 0.2, 0.3],
});

const httpRequestCounter = new Counter({
	name: "api_http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method"],
	registers: [registry],
});

const httpRequestDurationHistogram = new Histogram({
	name: "api_http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method"],
	buckets: [0.1, 0.5, 1, 3, 5, 10],
	registers: [registry],
});

const httpRequestErrorCounter = new Counter({
	name: "api_http_request_errors_total",
	help: "Total number of HTTP request errors",
	labelNames: ["errorType"],
	registers: [registry],
});

export default ApplyApiMiddleware(
	async (req, res) => {
		const startTime = Date.now();
		httpRequestCounter.labels(req.method).inc();

		try {
			const metrics = await registry.metrics();
			res.send(metrics);
		} catch (error) {
			httpRequestErrorCounter.labels("errorInMetrics").inc();
		} finally {
			const duration = (Date.now() - startTime) / 1000;
			httpRequestDurationHistogram.labels(req.method).observe(duration);
		}
	},
	[new MainMiddleware()],
);
