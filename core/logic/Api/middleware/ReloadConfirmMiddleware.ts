import { getExecutingEnvironment } from "@app/resolveModule/env";
import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

const onUnload = (ev) => ev.preventDefault();

export default class ReloadConfirmMiddleware extends Middleware {
	constructor() {
		super();
	}

	async Process(req: ApiRequest, response: ApiResponse): Promise<void> {
		if (getExecutingEnvironment() === "next") return await this._next.Process(req, response);

		window.addEventListener("beforeunload", onUnload);
		try {
			return await this._next.Process(req, response);
		} finally {
			window.removeEventListener("beforeunload", onUnload);
		}
	}
}
