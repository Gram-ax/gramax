const answer = {
	block: "answer",
	getAttrs: (tok) => ({
		type: tok.attrs.type,
		questionId: tok.attrs.questionId,
		answerId: tok.attrs.answerId,
		correct: tok.attrs.correct,
	}),
};

export default answer;
