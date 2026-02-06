import Anchor from "@components/controls/Anchor";
import getIssueLink from "../logic/getIssueLink";

export default function Kbd({ id }: { id: string }) {
	return (
		<Anchor className="issueLink" data-id={id} href={getIssueLink(id)}>
			{id}
		</Anchor>
	);
}
