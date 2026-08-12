/**
 * @jest-environment node
 */

import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";

describe("apiUtils", () => {
	describe("возвращает протокол и адрес хоста по url'y", () => {
		test("localhost", () => {
			const req: ApiRequest = { headers: { referer: "localhost:9090" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "localhost:9090" });
		});

		test("127.0.0.1", () => {
			const req: ApiRequest = { headers: { referer: "127.0.0.1:9090" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "127.0.0.1:9090" });
		});

		test("192.168.1.1 (http)", () => {
			const req: ApiRequest = { headers: { referer: "http://192.168.1.1" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "192.168.1.1" });
		});

		test("app.gram.ax (https)", () => {
			const req: ApiRequest = { headers: { referer: "https://app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "https", host: "app.gram.ax" });
		});

		test("app.gram.ax (http)", () => {
			const req: ApiRequest = { headers: { referer: "http://app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "app.gram.ax" });
		});

		test("app.gram.ax, когда нет 'referer'", () => {
			const req: ApiRequest = { headers: { "x-forwarded-host": "app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "app.gram.ax" });
		});

		test("app.gram.ax (http), когда нет 'referer'", () => {
			const req: ApiRequest = { headers: { host: "app.gram.ax" }, body: {}, query: {} };

			expect(apiUtils.getProtocolHost(req)).toEqual({ protocol: "http", host: "app.gram.ax" });
		});
	});

	// Bugsnag 698339579cb22f058b8efe15 — "TypeError: [NEXT] res.send is not a function".
	// Crawler-hit routes reached via rewrite (/robots.txt, /sitemap.xml) get a response
	// object without the NextApiResponse `.send` helper; every sender must degrade to `.end`.
	describe("отдаёт ответ, когда у res нет метода send (rewrite-роуты robots/sitemap)", () => {
		const makeSendlessRes = () => {
			const ended: unknown[] = [];
			const res = {
				statusCode: 0,
				setHeader: () => {},
				end: (body?: unknown) => {
					ended.push(body);
				},
			} as unknown as ApiResponse;
			return { res, ended };
		};

		test("sendError не кидает TypeError, а пишет тело через end", () => {
			const { res, ended } = makeSendlessRes();
			expect(() => apiUtils.sendError(res, { message: "boom" } as unknown as DefaultError)).not.toThrow();
			expect(res.statusCode).toBe(500);
			expect(ended).toHaveLength(1);
			expect(JSON.parse(ended[0] as string)).toMatchObject({ message: "boom" });
		});

		test("sendPlainText пишет тело через end", () => {
			const { res, ended } = makeSendlessRes();
			expect(() => apiUtils.sendPlainText(res, "User-agent: *")).not.toThrow();
			expect(res.statusCode).toBe(200);
			expect(ended).toEqual(["User-agent: *"]);
		});

		test("send всё ещё использует res.send, когда он доступен (обычные /api роуты)", () => {
			const sent: unknown[] = [];
			const res = {
				statusCode: 0,
				setHeader: () => {},
				send: (body?: unknown) => {
					sent.push(body);
				},
				end: () => {
					throw new Error("end не должен вызываться, когда есть send");
				},
			} as unknown as ApiResponse;
			apiUtils.sendPlainText(res, "ok");
			expect(sent).toEqual(["ok"]);
		});
	});
});
