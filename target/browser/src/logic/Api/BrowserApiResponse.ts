import ApiResponse from "@core/Api/ApiResponse";

export default class BrowserApiResponse implements ApiResponse {
	statusCode = 200;
	headers: { [key: string]: string } = {};
	body: any;

	get ok() {
		return this.statusCode == 200;
	}

	get status() {
		return this.statusCode;
	}

	setHeader(name: string, value: string) {
		this.headers[name] = value;
	}

	redirect(url: string) {
		window.location.replace(url);
	}

	send(body: any) {
		this.body = body;
	}

	end(body?: any) {
		if (!this.body) this.body = body;
	}

	json(): Promise<any> {
		if (!this.body?.buffer) return Promise.resolve(this.body);
		return Promise.resolve(JSON.parse(this.body));
	}

	text(): Promise<any> {
		return Promise.resolve(this.body?.toString());
	}
}
