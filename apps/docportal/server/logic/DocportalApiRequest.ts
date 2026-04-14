/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok */
import type ApiRequest from "@core/Api/ApiRequest";

export default class DocportalApiRequest implements ApiRequest {
	headers: { [key: string]: string };
	query: { [name: string]: string | string[] };
	body: any;
	method?: string;

	constructor(readonly bunReq: Request) {
		this.headers = Object.fromEntries(bunReq.headers);
		this.query = Object.fromEntries(new URL(bunReq.url).searchParams);
		this.body = bunReq.body;
		this.method = bunReq.method;
	}
}
