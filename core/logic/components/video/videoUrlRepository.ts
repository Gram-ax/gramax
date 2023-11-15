export default class VideoUrlRepository {
	private _urls = new Map<string, string>();
	private _vup: VideoUrlProvider;

	constructor(vup: VideoUrlProvider) {
		this._vup = vup;
	}

	async getUrl(path: string) {
		if (this._urls.has(path)) return this._urls.get(path);
		const url = await this._vup.getVideoUri(path);
		if (!url) return null;
		this._urls.set(path, url);
		return url;
	}
}

export interface VideoUrlProvider {
	getVideoUri(path: string): Promise<string>;
}
