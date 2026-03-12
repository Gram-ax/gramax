import type { Question } from "@ext/markdown/elements/question/types";
import { isAnswersCorrect } from "./isAnswersCorrect";

describe("isAnswersCorrect", () => {
	it("should return true if all answers are correct", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "one",
			answers: {
				a1: { id: "a1", type: "radio", correct: true, title: "Answer 1" },
				a2: { id: "a2", type: "radio", correct: false, title: "Answer 2" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: true }]);
	});

	it("should return false if there are incorrect answers", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "one",
			answers: {
				a1: { id: "a1", type: "radio", correct: true, title: "Answer 1" },
				a2: { id: "a2", type: "radio", correct: false, title: "Answer 2" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a2: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: false }]);
	});

	it("should return false if the number of answers does not match", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "many",
			answers: {
				a1: { id: "a1", type: "checkbox", correct: true, title: "Answer 1" },
				a2: { id: "a2", type: "checkbox", correct: true, title: "Answer 2" },
				a3: { id: "a3", type: "checkbox", correct: false, title: "Answer 3" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: false }]);
	});

	it("should return true for questions without correct answers (by default)", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "one",
			answers: {
				a1: { id: "a1", type: "radio", correct: null, title: "Answer 1" },
				a2: { id: "a2", type: "radio", correct: null, title: "Answer 2" },
				a3: { id: "a3", type: "radio", correct: null, title: "Answer 3" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: null }]);
	});

	it("should return false if the question is not found", () => {
		const questions = new Map<string, Question>();
		const answers = [{ questionId: "nonExistent", answersIds: { a1: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "nonExistent", isCorrect: false }]);
	});

	it("should correctly handle multiple choice", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "many",
			answers: {
				a1: { id: "a1", type: "checkbox", correct: true, title: "Answer 1" },
				a2: { id: "a2", type: "checkbox", correct: true, title: "Answer 2" },
				a3: { id: "a3", type: "checkbox", correct: false, title: "Answer 3" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true, a2: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: true }]);
	});

	it("should return false for multiple choice if not all correct answers are selected", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "many",
			answers: {
				a1: { id: "a1", type: "checkbox", correct: true, title: "Answer 1" },
				a2: { id: "a2", type: "checkbox", correct: true, title: "Answer 2" },
				a3: { id: "a3", type: "checkbox", correct: false, title: "Answer 3" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: false }]);
	});

	it("should return false for multiple choice if incorrect answers are selected", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "many",
			answers: {
				a1: { id: "a1", type: "checkbox", correct: true, title: "Answer 1" },
				a2: { id: "a2", type: "checkbox", correct: true, title: "Answer 2" },
				a3: { id: "a3", type: "checkbox", correct: false, title: "Answer 3" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true, a3: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: false }]);
	});

	it("should include correct answers ids if the option is true", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "one",
			answers: { a1: { id: "a1", type: "radio", correct: true, title: "Answer 1" } },
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true } }];
		const results = isAnswersCorrect(questions, answers, { includeCorrectAnswersIds: true });

		expect(results).toEqual([{ questionId: "q1", isCorrect: true, correctAnswersIds: ["a1"] }]);
	});

	it("should return null for questions without correct answers", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "one",
			answers: {
				a1: { id: "a1", type: "radio", correct: null, title: "Answer 1" },
				a2: { id: "a2", type: "radio", correct: null, title: "Answer 2" },
				a3: { id: "a3", type: "radio", correct: null, title: "Answer 3" },
			},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: true } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: null }]);
	});

	it("should return null for text questions", () => {
		const questions = new Map<string, Question>();
		questions.set("q1", {
			id: "q1",
			title: "Question 1",
			type: "text",
			answers: {},
		});

		const answers = [{ questionId: "q1", answersIds: { a1: "some text" } }];
		const results = isAnswersCorrect(questions, answers);

		expect(results).toEqual([{ questionId: "q1", isCorrect: null }]);
	});
});
