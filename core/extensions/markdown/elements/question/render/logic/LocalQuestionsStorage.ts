import { QuestionStorage } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { QuestionLocalStorageData } from "@ext/markdown/elements/question/types";

const localStorage = typeof window !== "undefined" ? window.localStorage : null;
const LOCAL_QUESTIONS_STORAGE_KEY = "local-questions-storage";

export class LocalQuestionsStorage implements QuestionStorage {
	private _key: string;

	constructor(private _path: string) {
		this._key = LOCAL_QUESTIONS_STORAGE_KEY;
	}

	get path(): string {
		return this._path;
	}

	setPath(path: string): void {
		this._path = path;
	}

	getQuestion(questionId: string): string[] {
		const questions = this._read() || {};
		return questions[this._path]?.[questionId] ?? [];
	}

	saveQuestion(questionId: string, answers: string[]): void {
		const questions = this._read() || {};

		if (!questions[this._path]) questions[this._path] = {};
		questions[this._path][questionId] = answers;
		this._write(questions);
	}
	
	clearQuestions(): void {
		const questions = this._read() || {};
		delete questions[this._path];
		this._write(questions);
	}

	private _read(): QuestionLocalStorageData {
		if (!localStorage) return null;
		return JSON.parse(localStorage.getItem(this._key));
	}

	private _write(data: QuestionLocalStorageData): void {
		if (!localStorage) return;
		localStorage.setItem(this._key, JSON.stringify(data));
	}
}
