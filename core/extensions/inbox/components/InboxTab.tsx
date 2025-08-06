import { TextSize } from "@components/Atoms/Button/Button";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import generateUniqueID from "@core/utils/generateUniqueID";
import styled from "@emotion/styled";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import Inbox from "@ext/inbox/components/Inbox";
import InboxFilter from "@ext/inbox/components/InboxFilter";
import InboxService from "@ext/inbox/components/InboxService";
import { InboxArticle } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";

const ExtensionWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-left: 1rem;
	padding-right: 1rem;
	margin-left: 0.5em;
	margin-bottom: 0.5em;
	margin-top: -0.5em;
`;

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
	}, [apiUrlCreator, pageData.userInfo, selectedAuthor, selectedIds]);

	useEffect(() => {
		if (pageData.userInfo?.mail) setSelectedAuthor(pageData.userInfo.mail);
	}, [pageData.userInfo]);

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
		<TabWrapper ref={tabWrapperRef} isTop show={show} title="" contentHeight={height}>
			<>
				<ExtensionWrapper>
					<ButtonLink
						textSize={TextSize.S}
						text={t("inbox.new-note")}
						style={{ marginLeft: "-8px" }}
						iconCode="plus"
						disabled={pageData.userInfo?.mail ? pageData.userInfo?.mail !== selectedAuthor : false}
						onClick={addNewNote}
					/>
					<InboxFilter
						show={show}
						apiUrlCreator={apiUrlCreator}
						selectedAuthor={selectedAuthor}
						setSelectedAuthor={setSelectedAuthor}
					/>
				</ExtensionWrapper>
				<Inbox tabWrapperRef={tabWrapperRef} show={show} setContentHeight={setHeight} />
			</>
		</TabWrapper>
	);
};

export default InboxTab;
