import resolveModule from "@app/resolveModule";
import ApiRequest from "../../logic/Api/ApiRequest";
import ApiResponse from "../../logic/Api/ApiResponse";
import Cookie from "./Cookie";

export default class CookieFactory {
	from(req?: ApiRequest, res?: ApiResponse): Cookie {
		const Cookie = resolveModule("Cookie");
		return new Cookie(req, res);
	}
}
