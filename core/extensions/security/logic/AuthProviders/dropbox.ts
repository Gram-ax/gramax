const options = {
	appkey: "l0243vsz7at698b",
	appsecret: "bha37kq3s1e2kgt",
	accessToken: "wNm6Fm8aqXYAAAAAAAAAAXOft2ABYvNDOClhOcB9Gj_mJid7EcnuD6Q-xNkRY_xh",
	apiCreateLinkUrl: "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
	apiGetSharedLinkUrl: "https://api.dropboxapi.com/2/sharing/list_shared_links",
};

export default class DropBox {
	static async getLink(path: string) {
		path = path.replace(/\\/g, "/");
		try {
			let response = await fetch(options.apiCreateLinkUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${options.accessToken}`,
					"Content-Type": "application/json",
				},
				body: `
{
    "path": "${path}",
    "settings": {
        "requested_visibility": "public",
        "audience": "public",
        "access": "viewer"
    }
}`,
			});
			let resJson = await response.json();
			if (resJson.url) return this._toDirectLink(resJson.url);
			response = await fetch(options.apiGetSharedLinkUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${options.accessToken}`,
					"Content-Type": "application/json",
				},
				body: `
{
	"path": "${path}",
	"direct_only": true
}`,
			});
			resJson = await response.json();
			return this._toDirectLink(resJson.links[0].url);
		} catch (e) {
			return "Error";
		}
	}

	static _toDirectLink(path: string): string {
		return path.replace(/\?dl=0$/, "?raw=1");
	}
}
