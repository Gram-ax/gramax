import { type ExportResult, ExportResultCode } from "@opentelemetry/core";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import * as idb from "idb";
import { otelSpanEncoder, type Span } from "../span";

const DB_NAME = "opentelemetry-logs";

export default class IndexedDbExporter implements sdk.SpanExporter {
	private _db: idb.IDBPDatabase<Span> | null;

	private constructor(
		private _storeName: string,
		db: idb.IDBPDatabase<Span>,
		private _keepMaxSessions: number,
	) {
		this._db = db;
	}

	static async init(keepMaxSessions: number = 15) {
		const date = new Date();
		const storeName = IndexedDbExporter._formatStoreName(date);
		const version = date.getTime();

		const exporter = new IndexedDbExporter(storeName, null, keepMaxSessions);
		exporter._db = await exporter._openWithUpgrade(version);
		return exporter;
	}

	private _openWithUpgrade(version: number): Promise<idb.IDBPDatabase<Span>> {
		return idb.openDB<Span>(DB_NAME, version, {
			upgrade: (db) => this._applyUpgrade(db),
			blocking: () => this._onBlocking(),
			blocked: () => {
				console.warn("[otel] indexed-db open blocked; awaiting older tabs to close");
			},
		});
	}

	private _openCurrent(): Promise<idb.IDBPDatabase<Span>> {
		return idb.openDB<Span>(DB_NAME, undefined, {
			blocking: () => this._onBlocking(),
		});
	}

	private _applyUpgrade(db: idb.IDBPDatabase<Span>) {
		if (!db.objectStoreNames.contains(this._storeName)) {
			const store = db.createObjectStore(this._storeName, { keyPath: "spanId", autoIncrement: false });
			store.createIndex("trace-id-idx", "traceId", { unique: false });
			store.createIndex("span-id-idx", "spanId", { unique: true });
		}

		const stores = Array.from(db.objectStoreNames)
			.map((s) => [s, IndexedDbExporter._extractDateFromStoreName(s)] as [string, Date])
			.filter(([, d]) => !Number.isNaN(d.getTime()))
			.sort((a, b) => a[1].getTime() - b[1].getTime());

		while (stores.length >= this._keepMaxSessions) {
			const entry = stores.shift();
			if (!entry) break;
			const [oldest] = entry;
			if (oldest === this._storeName) continue;
			db.deleteObjectStore(oldest);
		}
	}

	private async _onBlocking() {
		const oldDb = this._db;
		this._db = null;
		oldDb?.close();
		try {
			let db = await this._openCurrent();
			if (!db.objectStoreNames.contains(this._storeName)) {
				const recoverVersion = db.version + 1;
				db.close();
				db = await this._openWithUpgrade(recoverVersion);
			}
			this._db = db;
		} catch (err) {
			console.warn("indexed-db reopen failed after versionchange", err);
		}
	}

	async readFromIdb(amount?: number): Promise<Span[]> {
		if (!this._db) return [];
		const tx = this._db.transaction(this._storeName, "readonly");
		const store = tx.objectStore(this._storeName);

		let cur = await store.openCursor(null, "prev");

		const buf = [];

		while (cur && buf.length < (amount ?? Infinity)) {
			buf.push(cur.value);
			cur = await cur.continue();
		}

		return buf;
	}

	async exportRaw(spans: Span[]): Promise<void> {
		if (!this._db) return;
		const tx = this._db.transaction(this._storeName, "readwrite");
		const store = tx.objectStore(this._storeName);
		try {
			for (const span of spans) await store.put(span);
			tx.commit();
		} catch (e) {
			tx.abort();
			throw e;
		}
	}

	async export(spans: sdk.ReadableSpan[], resultCallback: (result: ExportResult) => void): Promise<void> {
		if (!this._db) {
			resultCallback({ code: ExportResultCode.SUCCESS });
			return;
		}
		const tx = this._db.transaction(this._storeName, "readwrite");
		const store = tx.objectStore(this._storeName);

		try {
			for (const otelSpan of spans) {
				const span = otelSpanEncoder.fromReadableSpan(otelSpan);
				await store.put(span);
			}
			tx.commit();
			resultCallback({ code: ExportResultCode.SUCCESS });
		} catch (e) {
			tx.abort();
			resultCallback({ code: ExportResultCode.FAILED, error: e });
		}
	}

	shutdown(): Promise<void> {
		this._db?.close();
		this._db = null;
		return Promise.resolve();
	}

	forceFlush?(): Promise<void> {
		return Promise.resolve();
	}

	private static _formatStoreName(date: Date): string {
		return `session-${date.toISOString()}`;
	}

	private static _extractDateFromStoreName(storeName: string): Date {
		const dateStr = storeName.slice(storeName.indexOf("-") + 1);
		return new Date(dateStr);
	}
}
