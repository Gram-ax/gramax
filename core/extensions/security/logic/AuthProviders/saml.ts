import fs from "fs";
import saml from "saml2-js";
import ApiRequest from "../../../../logic/Api/ApiRequest";
import ApiResponse from "../../../../logic/Api/ApiResponse";
import CookieFactory from "../../../cookie/CookieFactory";
import { AuthProvider } from "./AuthProvider";

export interface SamlProviderOptions {
	spOptions: ServiceProviderOptions;
	ipOptions: IdentityProvideOptions;
}

interface IdentityProvideOptions {
	sso_login_url: string;
	sso_logout_url: string;
	certificates: string[];
}

interface ServiceProviderOptions {
	entity_id: string;
	private_key?: string;
	certificate?: string;
	assert_endpoint: string;
	allow_unencrypted_assertion: boolean;
	audience: string;
}

export default class SamlProvider implements AuthProvider {
	private serviceProvider: saml.ServiceProvider;
	private identityProvider: saml.IdentityProvider;
	private users = new Set<string>();
	private _cookie = new CookieFactory();

	constructor(options: SamlProviderOptions) {
		options.spOptions.certificate = this._readCertificate();
		options.spOptions.private_key = this._readPrivateKey();
		this.serviceProvider = new saml.ServiceProvider(options.spOptions as any);
		this.identityProvider = new saml.IdentityProvider(options.ipOptions);
	}

	_readCertificate() {
		return fs.readFileSync(process.cwd() + "/logic/authentification/certificates/certificate.pem").toString();
	}

	_readPrivateKey() {
		return fs.readFileSync(process.cwd() + "/logic/authentification/certificates/key.pem").toString();
	}

	haveUser(user_id: string): boolean {
		return this.users.has(user_id);
	}

	async login(req: ApiRequest, res: ApiResponse) {
		return await new Promise<void>((resolve, reject) => {
			this.serviceProvider.create_login_request_url(this.identityProvider, {}, (err, login_url) => {
				if (err != null) reject(err);
				else {
					res.statusCode = 302;
					res.setHeader("location", login_url);
					res.end();
					resolve();
				}
			});
		}).catch((e) => {
			throw e;
		});
	}

	logout(req: ApiRequest, res: ApiResponse) {
		this._cookie.from(req, res).set("user_id", "", 0);
		res.statusCode = 302;
		res.setHeader("location", "/");
		res.end();
		// return await new Promise((resolve, reject) => {
		// 	this.serviceProvider.create_logout_request_url(this.identityProvider, {}, (err, logout_url) => {
		// 		if (err != null) reject(err);
		// 		else {
		// 			destroyCookie({ res }, "user_id");
		// 			res.statusCode = 302;
		// 			res.setHeader("location", logout_url);
		// 			res.end();
		// 			resolve();
		// 		}
		// 	});
		// }).catch((e) => {
		// 	throw e;
		// });
	}

	async assertEndpoint(req: ApiRequest, res: ApiResponse): Promise<void> {
		const options = { request_body: req.body };
		return await new Promise<void>((resolve, reject) => {
			this.serviceProvider.post_assert(this.identityProvider, options, (err, saml_res) => {
				if (err != null) reject(err);
				else {
					const name_id: string = saml_res?.user.name_id;
					this.users.add(name_id);
					this._cookie.from(req, res).set("user_id", name_id);
					res.statusCode = 302;
					res.setHeader("location", "/");
					res.end();
					resolve();
				}
			});
		}).catch((e) => {
			throw e;
		});
	}
}
