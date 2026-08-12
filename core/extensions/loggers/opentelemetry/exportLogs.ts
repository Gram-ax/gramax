import { getExecutingEnvironment } from "@app/resolveModule/env";
import { traced } from ".";
import type { LogScope } from "./exporters/indexed-db";
import { Level, type Span } from "./span";

const localTimestamp = (date: Date): string => {
	const pad = (n: number) => `${n}`.padStart(2, "0");
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	const time = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
	return `${day}_${time}`;
};

const triggerDownload = (data: Uint8Array, fileName: string): void => {
	const url = URL.createObjectURL(new Blob([data], { type: "application/zip" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/** Web/docportal: zip the spans stored in IndexedDB and trigger a browser download. */
const exportFromIndexedDb = async (scope: LogScope): Promise<void> => {
	const exporter = globalThis?.otel?.indexedDbExporter;
	if (!exporter) return;

	const sessions = await exporter.readSessionsByScope(scope);

	const JSZip = (await import("jszip")).default;
	const zip = new JSZip();

	let total = 0;
	for (const [name, spans] of sessions) {
		if (!spans.length) continue;
		zip.file(`${name}.ndjson`, spans.map((span: Span) => JSON.stringify(span)).join("\n"));
		total += spans.length;
	}

	if (total === 0) return;

	const data = await zip.generateAsync({
		type: "uint8array",
		compression: "DEFLATE",
		compressionOptions: { level: 6 },
	});

	triggerDownload(data, `logs-${scope}-${localTimestamp(new Date())}.zip`);
};

/** Desktop: hand off to Rust, which archives the on-disk `gx-*.ndjson` files behind a native save dialog. */
const exportFromRustNdjson = async (scope: LogScope): Promise<void> => {
	const { invoke } = await import("@tauri-apps/api/core");
	await invoke("collect_logs", { scope });
};

export const exportLogs = (scope: LogScope): Promise<void> =>
	traced("export-logs", { level: Level.Commands, args: [scope] }, async () => {
		if (getExecutingEnvironment() === "tauri") return exportFromRustNdjson(scope);
		return exportFromIndexedDb(scope);
	});
