import type FileProvider from "core/logic/FileProvider/model/FileProvider";
import { JSHandle } from "playwright";

export class FPContext {
	private _handle: FileProvider;

	constructor(handle: JSHandle) {
		this._handle = new Proxy(handle, {
			get(target, p) {
				return async (...args: any[]) => {
					args.push(p);
					return await target.evaluate(async (fp: FileProvider, args: any[]) => {
						const method = args.pop();
						return await fp[method].apply(
							...[fp, args.map((v) => (v.type == "path" ? window.debug.intoPath(v.val) : v))],
						);
					}, args);
				};
			},
		}) as unknown as FileProvider;
	}

	get handle() {
		return this._handle;
	}
}
