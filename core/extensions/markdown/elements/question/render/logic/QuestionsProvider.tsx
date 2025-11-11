import { ReactNode, createContext, memo, useRef, useContext } from "react";
import { SavedQuestion } from "@ext/markdown/elements/question/types";
import { createQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import { QuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { StoredQuestion } from "./QuestionsStore";

export type QuestionsStoreApi = ReturnType<typeof createQuestionsStore>;

interface QuestionsProviderProps {
	path: string;
	questions: Record<string, StoredQuestion>;
	children: ReactNode;
}

export interface QuestionStorage {
	getQuestion: (questionId: string) => SavedQuestion;
	saveQuestion: (questionId: string, question: SavedQuestion) => void;
}

export const QuestionsContext = createContext<QuestionsStoreApi>(null);

export const useQuestionsStore = <T,>(
	selector: (store: QuestionsStore) => T,
	equalityFn?: (a: T, b: T) => boolean,
): T => {
	const questionsStoreContext = useContext(QuestionsContext);

	if (questionsStoreContext === null) throw new Error("useQuestionsStore must be used within Question");
	return useStoreWithEqualityFn(questionsStoreContext, selector, equalityFn);
};

export const QuestionsProvider = memo(({ children, questions, path }: QuestionsProviderProps) => {
	const { isNext } = usePlatform();
	if (!isNext) return children;

	const storeRef = useRef<QuestionsStoreApi>(null);
	const pathRef = useRef<string>(path);

	if (!storeRef.current || pathRef.current !== path) {
		storeRef.current = createQuestionsStore(questions);
		pathRef.current = path;
	}

	return <QuestionsContext.Provider value={storeRef.current}>{children}</QuestionsContext.Provider>;
});
