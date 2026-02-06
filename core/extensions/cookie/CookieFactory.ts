import resolveModule from "@app/resolveModule/backend";
import BrowserCookie from "../../../apps/browser/src/logic/BrowserCookie";
import type ApiRequest from "../../logic/Api/ApiRequest";
import type ApiResponse from "../../logic/Api/ApiResponse";
import type Cookie from "./Cookie";

export default class CookieFactory {
	from(secret: string, req?: ApiRequest, res?: ApiResponse): Cookie {
		const Cookie = resolveModule("Cookie");
		const migrateFrom = new BrowserCookie(secret);
		return new Cookie(secret, req, res, migrateFrom);
	}
}
