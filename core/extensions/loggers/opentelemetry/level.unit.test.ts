import { context as apiContext, trace as apiTrace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { addEvent, getLogLevel, setLogLevel, traced } from "./index";
import { isLevelEnabled, Level, levelRank, SpanAttribute } from "./span";

describe("level ranking", () => {
	test("verbosity ascends Commands < Important < Internal < Files < Full", () => {
		expect(levelRank(Level.Commands)).toBeLessThan(levelRank(Level.Important));
		expect(levelRank(Level.Important)).toBeLessThan(levelRank(Level.Internal));
		expect(levelRank(Level.Internal)).toBeLessThan(levelRank(Level.Files));
		expect(levelRank(Level.Files)).toBeLessThan(levelRank(Level.Full));
	});
});

describe("isLevelEnabled", () => {
	test("Commands threshold captures only Commands", () => {
		expect(isLevelEnabled(Level.Commands, Level.Commands)).toBe(true);
		expect(isLevelEnabled(Level.Important, Level.Commands)).toBe(false);
		expect(isLevelEnabled(Level.Internal, Level.Commands)).toBe(false);
		expect(isLevelEnabled(Level.Files, Level.Commands)).toBe(false);
		expect(isLevelEnabled(Level.Full, Level.Commands)).toBe(false);
	});

	test("Important threshold adds important supplementary logs, drops internal detail", () => {
		expect(isLevelEnabled(Level.Commands, Level.Important)).toBe(true);
		expect(isLevelEnabled(Level.Important, Level.Important)).toBe(true);
		expect(isLevelEnabled(Level.Internal, Level.Important)).toBe(false);
	});

	test("Internal threshold captures Commands, Important and Internal, drops Files and Full", () => {
		expect(isLevelEnabled(Level.Commands, Level.Internal)).toBe(true);
		expect(isLevelEnabled(Level.Important, Level.Internal)).toBe(true);
		expect(isLevelEnabled(Level.Internal, Level.Internal)).toBe(true);
		expect(isLevelEnabled(Level.Files, Level.Internal)).toBe(false);
		expect(isLevelEnabled(Level.Full, Level.Internal)).toBe(false);
	});

	test("Files threshold adds file writes, still drops Full", () => {
		expect(isLevelEnabled(Level.Internal, Level.Files)).toBe(true);
		expect(isLevelEnabled(Level.Files, Level.Files)).toBe(true);
		expect(isLevelEnabled(Level.Full, Level.Files)).toBe(false);
	});

	test("Full threshold captures everything", () => {
		expect(isLevelEnabled(Level.Commands, Level.Full)).toBe(true);
		expect(isLevelEnabled(Level.Internal, Level.Full)).toBe(true);
		expect(isLevelEnabled(Level.Files, Level.Full)).toBe(true);
		expect(isLevelEnabled(Level.Full, Level.Full)).toBe(true);
	});
});

describe("getLogLevel / setLogLevel", () => {
	afterEach(() => {
		delete (globalThis as { otel?: unknown }).otel;
	});

	test("defaults to Important when otel not registered", () => {
		delete (globalThis as { otel?: unknown }).otel;
		expect(getLogLevel()).toBe(Level.Important);
	});

	test("setLogLevel is a no-op without an otel context", () => {
		delete (globalThis as { otel?: unknown }).otel;
		setLogLevel(Level.Full);
		expect(getLogLevel()).toBe(Level.Important);
	});

	test("setLogLevel updates the active level", () => {
		(globalThis as { otel?: unknown }).otel = {};
		setLogLevel(Level.Internal);
		expect(getLogLevel()).toBe(Level.Internal);
	});
});

describe("capture-time filtering", () => {
	let exporter: InMemorySpanExporter;
	const contextManager = new AsyncLocalStorageContextManager();

	beforeAll(() => {
		contextManager.enable();
		apiContext.setGlobalContextManager(contextManager);
	});

	afterAll(() => {
		apiContext.disable();
	});

	beforeEach(() => {
		exporter = new InMemorySpanExporter();
		const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
		(globalThis as { otel?: unknown }).otel = {
			traceApi: apiTrace,
			tracerApi: provider.getTracer("test"),
			registered: true,
			logLevel: Level.Commands,
		};
	});

	afterEach(() => {
		delete (globalThis as { otel?: unknown }).otel;
	});

	const names = () => exporter.getFinishedSpans().map((s) => s.name);

	test("span above the threshold is not created, fn still runs", () => {
		const result = traced("quiet", { level: Level.Full }, () => 42);
		expect(result).toBe(42);
		expect(names()).toEqual([]);
	});

	test("span at or below the threshold is exported with its level attribute", () => {
		void traced("visible", () => 1);
		const [span] = exporter.getFinishedSpans();
		expect(span.name).toBe("visible");
		expect(span.attributes[SpanAttribute.Level]).toBe(Level.Commands);
	});

	test("failed suppressed span is materialized with error status", () => {
		expect(() =>
			traced("boom", { level: Level.Full }, () => {
				throw new Error("fail");
			}),
		).toThrow("fail");

		const [span] = exporter.getFinishedSpans();
		expect(span.name).toBe("boom");
		expect(span.status.code).toBe(2);
		expect(span.events.some((e) => e.name === "exception")).toBe(true);
	});

	test("failed span materializes its suppressed ancestor chain with correct parenting", async () => {
		await expect(
			traced("root", async () => {
				await traced("middle", { level: Level.Internal }, async () => {
					await traced("leaf", { level: Level.Full }, async () => {
						throw new Error("deep fail");
					});
				});
			}),
		).rejects.toThrow("deep fail");

		const spans = exporter.getFinishedSpans();
		const byName = (name: string) => {
			const found = spans.find((s) => s.name === name);
			if (!found) throw new Error(`span "${name}" was not exported`);
			return found;
		};
		const root = byName("root");
		const middle = byName("middle");
		const leaf = byName("leaf");

		expect(leaf.parentSpanContext?.spanId).toBe(middle.spanContext().spanId);
		expect(middle.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
		expect(leaf.status.code).toBe(2);
		expect(middle.status.code).toBe(2);
	});

	test("suppressed span that succeeds after a caught descendant error is still exported", () => {
		void traced("outer", { level: Level.Internal }, () => {
			try {
				void traced("inner", { level: Level.Full }, () => {
					throw new Error("caught");
				});
			} catch {
				// swallowed — outer finishes fine, but both spans must survive
			}
		});

		expect(names().sort()).toEqual(["inner", "outer"]);
	});

	test("threshold-passing event inside a suppressed span materializes it (caught-error signal survives)", () => {
		void traced("root", () => {
			void traced("quiet-fetch", { level: Level.Internal }, () => {
				addEvent("error", Level.Commands, { message: "boom" });
			});
		});

		const spans = exporter.getFinishedSpans();
		const quiet = spans.find((s) => s.name === "quiet-fetch");
		const root = spans.find((s) => s.name === "root");
		expect(quiet).toBeDefined();
		expect(quiet.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
		expect(quiet.events.map((e) => e.name)).toContain("error");
		expect(root.events).toHaveLength(0);
	});

	test("below-threshold event inside a suppressed span does not materialize it", () => {
		void traced("holder", () => {
			void traced("quiet", { level: Level.Internal }, () => {
				addEvent("noise", Level.Full);
			});
		});

		expect(names()).toEqual(["holder"]);
	});

	test("addEvent respects the threshold and tags the level", () => {
		void traced("holder", () => {
			addEvent("kept", Level.Commands);
			addEvent("dropped", Level.Full);
		});

		const [span] = exporter.getFinishedSpans();
		const eventNames = span.events.map((e) => e.name);
		expect(eventNames).toContain("kept");
		expect(eventNames).not.toContain("dropped");
		expect(span.events.find((e) => e.name === "kept")?.attributes?.[SpanAttribute.Level]).toBe(Level.Commands);
	});
});
