import type ContextService from "@core-ui/ContextServices/ContextService";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { createContext, type Dispatch, type ReactElement, type SetStateAction, useContext, useState } from "react";

const PublishChangesContext = createContext<DiffFlattenTreeAnyItem[]>(undefined);

class PublishChangesProvider implements ContextService<DiffFlattenTreeAnyItem[]> {
	private _setPublishChanges: Dispatch<SetStateAction<DiffFlattenTreeAnyItem[]>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [publishChanges, setPublishChanges] = useState<DiffFlattenTreeAnyItem[]>(undefined);
		this._setPublishChanges = setPublishChanges;

		return <PublishChangesContext.Provider value={publishChanges}>{children}</PublishChangesContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: DiffFlattenTreeAnyItem[] }): ReactElement {
		return <PublishChangesContext.Provider value={value}>{children}</PublishChangesContext.Provider>;
	}

	get value(): DiffFlattenTreeAnyItem[] {
		// biome-ignore lint/correctness/useHookAtTopLevel: epxected
		return useContext(PublishChangesContext);
	}

	set value(value: DiffFlattenTreeAnyItem[]) {
		this._setPublishChanges?.(value);
	}
}

export default new PublishChangesProvider();
