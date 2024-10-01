import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const ul: HTMLNodeConverter = () => {
	return {
		type: "bullet_list",
	};
};

export default ul;
