import { PipelineFunction } from "lunr";

const customPipeline: PipelineFunction = (t: any) => {
	if (!t?.str || typeof t.str !== "string") return [];

	const strs = t.str
		.replace(/[-.,;:?!]/g, " ")
		.split(" ")
		.filter((s) => s.length > 0);

	// if (strs.length == 1) {
	t.str = strs[0];
	return t;
	// }

	// return strs.map((str) => ({ str, metadata: t.metadata }));
};

export default customPipeline;
