import { TextSize } from "@components/Atoms/Button/Button";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import generateUniqueID from "@core/utils/generateUniqueID";
import styled from "@emotion/styled";
import Inbox from "@ext/inbox/components/Inbox";
import InboxService from "@ext/inbox/components/InboxService";
import InboxUtility from "@ext/inbox/logic/InboxUtility";
import { InboxArticle } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import { useCallback, useRef, useState } from "react";

const ExtensionWrapper = styled.div`
	margin-left: -0.5em;
`;

interface InboxTabProps {
	show: boolean;
}

const InboxTab = ({ show }: InboxTabProps) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageData = PageDataContextService.value;
	const { selectedPath } = InboxService.value;

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

		const res = await FetchService.fetch<InboxArticle[]>(apiUrlCreator.getInboxArticles());
		if (!res.ok) return;

		const newNotes = await res.json();
		const createdArticle = newNotes.find((note) => note.logicPath.includes(uniqueID));

		InboxService.setNotes(newNotes);
		if (!createdArticle) return;

		const newPaths = InboxUtility.setSelectedPath(selectedPath, [createdArticle.logicPath]);
		InboxService.setSelectedPath(newPaths);
	}, [apiUrlCreator, pageData.userInfo]);

	return (
		<TabWrapper
			ref={tabWrapperRef}
			isTop
			show={show}
			title=""
			contentHeight={height}
			titleRightExtension={
				<ExtensionWrapper>
					<ButtonLink
						textSize={TextSize.S}
						text={t("inbox.new-note")}
						style={{ marginLeft: "-8px" }}
						iconCode="plus"
						onClick={addNewNote}
					/>
				</ExtensionWrapper>
			}
		>
			<Inbox tabWrapperRef={tabWrapperRef} show={show} setContentHeight={setHeight} />
		</TabWrapper>
	);
};

export default InboxTab;
