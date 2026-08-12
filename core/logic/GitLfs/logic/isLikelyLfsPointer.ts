/** LFS pointer files are tiny text stubs; anything larger is real content and never a pointer. */
export const LFS_POINTER_MAX_SIZE = 200;

export const isLikelyLfsPointer = (buf: Buffer): boolean => {
	const signature = Buffer.from("version https://git-lfs.github.com/spec/v1");

	if (!buf) return false;
	if (buf.length < 100 || buf.length > LFS_POINTER_MAX_SIZE) return false;

	for (let i = 0; i < signature.length; i++) {
		if (buf.readInt8(i) !== signature.readInt8(i)) return false;
	}

	return true;
};
