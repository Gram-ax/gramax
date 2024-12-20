const imageSchema = {
	group: "inline",
	inline: true,
	draggable: true,
	attrs: {
		src: { default: null },
		alt: { default: null },
		crop: { default: null },
		title: { default: null },
		scale: { default: null },
		objects: { default: [] },
		width: { default: null },
		height: { default: null },
	},
};

export default imageSchema;
