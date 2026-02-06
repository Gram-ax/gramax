import { getExecutingEnvironment } from "@app/resolveModule/env";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

const onUnload = (ev) => ev.preventDefault();

export default class ReloadConfirmMiddleware extends Middleware {
	constructor() {
		super();
	}

	async Process(req: ApiRequest, response: ApiResponse): Promise<void> {
		if (getExecutingEnvironment() === "next" || getExecutingEnvironment() === "static")
			return await this._next.Process(req, response);

		window.addEventListener("beforeunload", onUnload);
		try {
			return await this._next.Process(req, response);
		} finally {
			window.removeEventListener("beforeunload", onUnload);
		}
	}
}
