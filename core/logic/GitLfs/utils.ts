const SIGNATURE = Buffer.from("version https://git-lfs.github.com/spec/v1");

export const isLikelyLfsPointer = (buf: Buffer): boolean => {
	if (!buf) return false;

	if (buf.length < 100 || buf.length > 200) return false;

	for (let i = 0; i < SIGNATURE.length; i++) {
		if (buf.readInt8(i) != SIGNATURE.readInt8(i)) return false;
	}

	return true;
};
