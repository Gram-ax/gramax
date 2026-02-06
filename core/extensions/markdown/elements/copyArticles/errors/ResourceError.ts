import DefaultError from "@ext/errorHandlers/logic/DefaultError";

export class ResourceError extends DefaultError {
	constructor(
		message: string,
		public readonly src: string,
		cause?: Error,
	) {
		super(message, cause);
		this.name = "ResourceError";
	}
}

export class LfsPointerError extends ResourceError {
	constructor(src: string) {
		super(`Resource "${src}" is an LFS pointer and needs to be fetched`, src);
		this.name = "LfsPointerError";
	}
}

export class ResourceLoadError extends ResourceError {
	constructor(src: string, cause?: Error) {
		super(`Failed to load resource "${src}"`, src, cause);
		this.name = "ResourceLoadError";
	}
}

export class ResourceNotFoundError extends ResourceError {
	constructor(src: string) {
		super(`Resource "${src}" not found`, src);
		this.name = "ResourceNotFoundError";
	}
}

export type ResourceResult<T> = { ok: true; data: T } | { ok: false; error: ResourceError };
