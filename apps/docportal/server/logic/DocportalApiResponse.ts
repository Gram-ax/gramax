import type ApiResponse from "@core/Api/ApiResponse";

export default class DocportalApiResponse implements ApiResponse {
	statusCode: number;
	headers: { [key: string]: string };
	get ok() {
		return this.statusCode >= 200 && this.statusCode < 300;
	}
	body: BodyInit;

	constructor(readonly res: Response) {
		this.statusCode = res.status;
		this.headers = Object.fromEntries(res.headers);
	}

	redirect = (href: string) => {
		this.statusCode = 307;
		this.setHeader("Location", href);
	};

	arrayBuffer = () => Promise.resolve(new Uint8Array());

	send = (body: BodyInit) => {
		this.body = body;
	};

	end = () => {};

	getHeader(name: string) {
		return this.headers[name];
	}

	setHeader(name: string, value: string): void {
		this.headers[name] = value;
	}

	mergeInto(response: Response): Response {
		const setCookie = this.headers["Set-Cookie"];
		if (!setCookie) return response;

		const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
		const newHeaders = new Headers(response.headers);
		for (const cookie of cookies) {
			newHeaders.append("Set-Cookie", cookie);
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders,
		});
	}

	getBunResponse(): Response {
		return new Response(this.body, {
			status: this.statusCode,
			headers: new Headers(this.headers),
		});
	}
}
