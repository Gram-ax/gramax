import resolveModule from "@app/resolveModule/backend";
import ApiRequest from "../../logic/Api/ApiRequest";
import ApiResponse from "../../logic/Api/ApiResponse";
import Cookie from "./Cookie";

export default class CookieFactory {
	from(secret: string, req?: ApiRequest, res?: ApiResponse): Cookie {
		const Cookie = resolveModule("Cookie");
		return new Cookie(secret, req, res);
	}
}
