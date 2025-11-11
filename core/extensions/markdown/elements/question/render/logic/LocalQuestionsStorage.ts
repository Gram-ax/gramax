import { QuestionStorage } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { SavedQuestion } from "@ext/markdown/elements/question/types";

const localStorage = typeof window !== "undefined" ? window.localStorage : null;
const LOCAL_QUESTIONS_STORAGE_KEY = "local-questions-storage";

export class LocalQuestionsStorage implements QuestionStorage {
	private _key: string;

	constructor() {
		this._key = LOCAL_QUESTIONS_STORAGE_KEY;
	}

	getQuestion(questionId: string): SavedQuestion {
		const questions = this._read() || {};
		return questions[questionId];
	}

	saveQuestion(questionId: string, question: SavedQuestion): void {
		const questions = this._read() || {};
		questions[questionId] = question;
		this._write(questions);
	}

	private _read(): Record<string, SavedQuestion> {
		if (!localStorage) return null;
		return JSON.parse(localStorage.getItem(this._key));
	}

	private _write(data: Record<string, SavedQuestion>): void {
		if (!localStorage) return;
		localStorage.setItem(this._key, JSON.stringify(data));
	}
}
