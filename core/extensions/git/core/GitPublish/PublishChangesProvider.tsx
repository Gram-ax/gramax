import ContextService from "@core-ui/ContextServices/ContextService";
import { DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useState } from "react";

const PublishChangesContext = createContext<DiffTreeAnyItem[]>(undefined);

class PublishChangesProvider implements ContextService<DiffTreeAnyItem[]> {
	private _setPublishChanges: Dispatch<SetStateAction<DiffTreeAnyItem[]>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [publishChanges, setPublishChanges] = useState<DiffTreeAnyItem[]>(undefined);
		this._setPublishChanges = setPublishChanges;

		return <PublishChangesContext.Provider value={publishChanges}>{children}</PublishChangesContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: DiffTreeAnyItem[] }): ReactElement {
		return <PublishChangesContext.Provider value={value}>{children}</PublishChangesContext.Provider>;
	}

	get value(): DiffTreeAnyItem[] {
		return useContext(PublishChangesContext);
	}

	set value(value: DiffTreeAnyItem[]) {
		this._setPublishChanges?.(value);
	}
}

export default new PublishChangesProvider();
