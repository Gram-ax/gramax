import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const tbody: HTMLNodeConverter = () => {
	return {
		type: "table",
	};
};

export default tbody;
