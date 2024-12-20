import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const ul: HTMLNodeConverter = () => {
	return {
		type: "bulletList",
	};
};

export default ul;
