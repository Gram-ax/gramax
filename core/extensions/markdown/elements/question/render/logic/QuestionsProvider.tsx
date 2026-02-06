import Workspace from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { createQuestionsStore, QuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import { createContext, memo, ReactNode, useContext, useRef } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { LocalQuestionsStorage } from "./LocalQuestionsStorage";
import { StoredQuestion, useIsAnsweredToTest } from "./QuestionsStore";

export type QuestionsStoreApi = ReturnType<typeof createQuestionsStore>;

interface QuestionsProviderProps {
	path: string;
	questions: Record<string, StoredQuestion>;
	children: ReactNode;
}

export interface QuestionStorage {
	getQuestion: (questionId: string) => string[];
	saveQuestion: (questionId: string, answers: string[]) => void;
	clearQuestions: () => void;
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

const ChildrenOfProvider = ({ children, path }: { children: ReactNode; path: string }) => {
	const workspace = Workspace.current();
	if (!workspace?.enterprise?.gesUrl) return children;

	useIsAnsweredToTest([path]);
	return children;
};

export const QuestionsProvider = memo(({ children, questions, path }: QuestionsProviderProps) => {
	const { isNext } = usePlatform();
	if (!isNext) return children;

	const storeRef = useRef<QuestionsStoreApi>(null);
	const localStorageRef = useRef<LocalQuestionsStorage>(new LocalQuestionsStorage(path));

	if (!storeRef.current || localStorageRef.current.path !== path) {
		localStorageRef.current.setPath(path);
		storeRef.current = createQuestionsStore(questions, localStorageRef.current);
	}

	return (
		<QuestionsContext.Provider value={storeRef.current}>
			<ChildrenOfProvider path={path}>{children}</ChildrenOfProvider>
		</QuestionsContext.Provider>
	);
});
