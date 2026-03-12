import { type ExportResult, ExportResultCode } from "@opentelemetry/core";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import * as idb from "idb";
import { otelSpanEncoder, type Span } from "../span";

export default class IndexedDbExporter implements sdk.SpanExporter {
	private constructor(
		private _storeName: string,
		private _db: idb.IDBPDatabase<Span>,
	) {}

	static async init(keepMaxSessions: number = 15) {
		const date = new Date();
		const storeName = this._formatStoreName(date);

		const db = await idb.openDB<Span>("opentelemetry-logs", date.getTime(), {
			upgrade: (db) => {
				const store = db.createObjectStore(storeName, { keyPath: "spanId", autoIncrement: false });

				if (!store.indexNames.contains("trace-id-idx"))
					store.createIndex("trace-id-idx", "traceId", { unique: false });

				if (!store.indexNames.contains("span-id-idx"))
					store.createIndex("span-id-idx", "spanId", { unique: true });

				const stores = Array.from(db.objectStoreNames).map(
					(s) => [s, IndexedDbExporter._extractDateFromStoreName(s)] as [string, Date],
				);
				stores.sort((a, b) => {
					return a[1].getTime() - b[1].getTime();
				});

				while (stores.length >= keepMaxSessions) {
					db.deleteObjectStore(stores.shift()[0]);
				}
			},
		});

		return new this(storeName, db);
	}

	async readFromIdb(amount?: number): Promise<Span[]> {
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
		this._db.close();
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
