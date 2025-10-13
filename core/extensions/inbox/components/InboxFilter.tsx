import { TextSize } from "@components/Atoms/Button/Button";
import Icon from "@components/Atoms/Icon";
import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import InboxService from "@ext/inbox/components/InboxService";
import t from "@ext/localization/locale/translate";
import { useIsRepoOk } from "@ext/storage/logic/utils/useStorage";
import { Command, CommandItem, CommandEmpty, CommandList, CommandInput } from "@ui-kit/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
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
	const [isOpen, setIsOpen] = useState(false);
	const isRepoOk = useIsRepoOk();
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

	const onItemClick = useCallback((item: string) => {
		setSelectedAuthor(item);
		setIsOpen(false);
	}, []);

	if (!show || !isRepoOk) return null;

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger>
				<Wrapper>
					<ButtonLink textSize={TextSize.S} text={selectedAuthor} style={{ marginLeft: "-8px" }} />
					<Icon code="chevron-down" />
				</Wrapper>
			</PopoverTrigger>
			<PopoverContent className="p-0">
				<Command>
					<CommandInput placeholder={t("inbox.search-placeholder")} />
					<CommandList>
						<CommandEmpty>{t("inbox.no-user-with-this-name")}</CommandEmpty>
						{items.map((item) => (
							<CommandItem
								key={item}
								value={item}
								onSelect={() => onItemClick(item)}
								className="justify-between"
							>
								{item}
								{selectedAuthor === item && <Icon code="check" />}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default memo(InboxFilter);
