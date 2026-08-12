export class AgentLlmAdapter {
	url: string;
	private _apiKey = "";

	constructor(url: string, apiKey: string) {
		this.url = url;
		this.apiKey = apiKey;
	}

	get apiKey(): string {
		return this._apiKey;
	}

	set apiKey(value: string) {
		this._apiKey = value;
	}

	getHeaders(): Record<string, string> {
		return {
			Authorization: `Bearer ${this.apiKey}`,
			"Content-Type": "application/json",
			Accept: "text/event-stream",
		};
	}
}
