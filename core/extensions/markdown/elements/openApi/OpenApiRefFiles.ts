import Path from "@core/FileProvider/Path/Path";

export type OpenApiRefFiles = Record<string, unknown>;
export type OpenApiRefs = string[];
export type OpenApiRefsData = {
	refs: OpenApiRefs;
	files: OpenApiRefFiles;
};
export type OpenApiAllRefFilesResponse = {
	files?: OpenApiRefFiles;
};

/**
 * The single rule that turns a `$ref` into a key of `OpenApiRefFiles`: resolve it against the directory of
 * the file that declares it. The backend fills the map with this, the client looks refs up with this -- two
 * implementations drifting apart means bundled refs silently fail to find their file, so there is one.
 */
export const resolveOpenApiRefPath = (from: Path, ref: string): Path => from.parentDirectoryPath.join(new Path(ref));

export const resolveOpenApiRefKey = (fromKey: string, ref: string): string =>
	resolveOpenApiRefPath(new Path(fromKey), ref).value;
