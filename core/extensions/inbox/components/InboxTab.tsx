import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import generateUniqueID from "@core/utils/generateUniqueID";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import Inbox from "@ext/inbox/components/Inbox";
import InboxFilter from "@ext/inbox/components/InboxFilter";
import InboxService from "@ext/inbox/components/InboxService";
import type { InboxArticle } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { useCallback, useEffect, useRef, useState } from "react";

interface InboxTabProps {
	show: boolean;
}

const InboxTab = ({ show }: InboxTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageData = PageDataContextService.value;
	const { selectedIds } = InboxService.value;

	const [height, setHeight] = useState(0);
	const [selectedAuthor, setSelectedAuthor] = useState<string>(pageData.userInfo?.mail);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const addNewNote = useCallback(async () => {
		const uniqueID = generateUniqueID();
		await FetchService.fetch<InboxArticle>(
			apiUrlCreator.createFileInGramaxDir(uniqueID, "inbox"),
			JSON.stringify({
				props: {
					date: new Date().toISOString(),
					author: AuthorInfoCodec.serialize({
						name: pageData.userInfo?.name ?? "admin",
						email: pageData.userInfo?.mail ?? "admin",
					}),
				},
			}),
		);

		if (selectedAuthor !== pageData.userInfo?.mail) return;

		const res = await FetchService.fetch<InboxArticle[]>(apiUrlCreator.getInboxArticles(pageData.userInfo?.mail));
		if (!res.ok) return;

		const newItems = await res.json();
		InboxService.setItems(newItems);
	}, [selectedAuthor]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (pageData.userInfo?.mail) setSelectedAuthor(pageData.userInfo.mail);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		const listener = () => {
			selectedIds.forEach((id) => InboxService.closeNote(id));
		};

		BranchUpdaterService.addListener(listener);

		return () => {
			BranchUpdaterService.removeListener(listener);
		};
	}, []);

	return (
		<TabWrapper contentHeight={height} isTop ref={tabWrapperRef} show={show}>
			<>
				<div className="flex items-center justify-between px-4 mb-2 -mt-2">
					<Button
						className="p-0 h-auto"
						disabled={pageData.userInfo?.mail ? pageData.userInfo?.mail !== selectedAuthor : false}
						onClick={addNewNote}
						size="sm"
						startIcon="plus"
						variant="text"
					>
						{t("inbox.new-note")}
					</Button>
					<InboxFilter
						apiUrlCreator={apiUrlCreator}
						selectedAuthor={selectedAuthor}
						setSelectedAuthor={setSelectedAuthor}
						show={show}
					/>
				</div>
				<Inbox setContentHeight={setHeight} show={show} tabWrapperRef={tabWrapperRef} />
			</>
		</TabWrapper>
	);
};

export default InboxTab;
