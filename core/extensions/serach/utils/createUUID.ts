import { XxHash } from "@core/Hash/Hasher";

function createUUID(...args: any[]) {
	const hasher = XxHash.hasher();
	args.forEach(x => hasher.hash(x));
	return hasher.finalize().toString(16).padStart(32, "0");
}

export default createUUID;
