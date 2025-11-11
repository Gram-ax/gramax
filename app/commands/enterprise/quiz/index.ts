import addAnswer from "@app/commands/enterprise/quiz/answer/add";
import addTest from "@app/commands/enterprise/quiz/test/add";
import existTest from "@app/commands/enterprise/quiz/test/exist";

export default {
	test: {
		add: addTest,
		exist: existTest,
	},
	answer: {
		add: addAnswer,
	},
};
