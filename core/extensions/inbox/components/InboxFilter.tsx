import { TextSize } from "@components/Atoms/Button/Button";
import Dropdown from "@components/Atoms/Dropdown";
import Icon from "@components/Atoms/Icon";
import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import InboxService from "@ext/inbox/components/InboxService";
import t from "@ext/localization/locale/translate";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageInitialized";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

interface InboxFilterProps {
	show: boolean;
	apiUrlCreator: ApiUrlCreator;
	selectedAuthor: string;
	setSelectedAuthor: (author: string) => void;
}

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	margin-right: -0.35em;

	.transparent {
		display: block;
		max-width: 10em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		justify-content: start;
		direction: ltr;
		margin-left: 0 !important;
	}
`;

const useInboxUsers = (apiUrlCreator: ApiUrlCreator, curUserEmail: string, deps?: unknown[]): string[] => {
	const [users, setUsers] = useState<string[]>([]);

	const fetchUsers = useCallback(async () => {
		const url = apiUrlCreator.getInboxUsers();
		const res = await FetchService.fetch<string[]>(url);
		const users = await res.json();
		setUsers(
			users.sort((a: string, b: string) => {
				if (a === curUserEmail) return -1;
				if (b === curUserEmail) return 1;
				return a.localeCompare(b);
			}),
		);
	}, [apiUrlCreator, curUserEmail]);

	useEffect(() => {
		void fetchUsers();
	}, deps);

	return users || [];
};

const InboxFilter = ({ show, apiUrlCreator, selectedAuthor, setSelectedAuthor }: InboxFilterProps) => {
	const isStorageInitialized = useIsStorageInitialized();
	const pageData = PageDataContext.value;
	const authors = useInboxUsers(apiUrlCreator, pageData.userInfo?.mail, [pageData.userInfo?.mail, show]);

	useEffect(() => {
		if (show) InboxService.fetchInbox(selectedAuthor, apiUrlCreator);
	}, [show]);

	useEffect(() => {
		if (show) {
			InboxService.setItems([]);
			InboxService.fetchInbox(selectedAuthor, apiUrlCreator);
		}
	}, [selectedAuthor]);

	const items = useMemo(() => {
		const newAuthors = [...authors];
		const curUserInAuthors = newAuthors.find((author) => author === pageData.userInfo?.mail);

		if (!curUserInAuthors) {
			newAuthors.unshift(pageData.userInfo?.mail);
		}

		return newAuthors;
	}, [authors, pageData.userInfo]);

	if (!show || !isStorageInitialized) return null;

	const onItemClick = (item: string) => {
		setSelectedAuthor(item);
	};

	return (
		<Dropdown
			searchable
			placeholder={t("inbox.search-placeholder")}
			items={items}
			item={selectedAuthor}
			onItemClick={onItemClick}
			noResults={t("inbox.no-user-with-this-name")}
			trigger={
				<Wrapper>
					<ButtonLink textSize={TextSize.S} text={selectedAuthor} style={{ marginLeft: "-8px" }} />
					<Icon code="chevron-down" />
				</Wrapper>
			}
		/>
	);
};

export default memo(InboxFilter);
