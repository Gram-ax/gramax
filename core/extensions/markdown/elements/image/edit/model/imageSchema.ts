const imageSchema = {
	group: "inline",
	inline: true,
	draggable: true,
	attrs: {
		src: { default: null },
		alt: { default: null },
		crop: { default: null },
		title: { default: null },
		objects: { default: null },
	},
};

export default imageSchema;
