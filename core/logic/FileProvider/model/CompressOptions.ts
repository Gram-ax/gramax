type CompressOptions =
	| {
			type: "image";
			target: "png";
			compressionLevel?: number;
	  }
	| {
			type: "image";
			target: "jpeg" | "webp";
			quality?: number;
			effort?: number;
	  };

export default CompressOptions;
