import Anchor from "@components/controls/Anchor";
import getIssueLink from "../logic/getIssueLink";

export default function Kbd({ id }: { id: string }) {
	return (
		<Anchor className="issueLink" href={getIssueLink(id)} data-id={id}>
			{id}
		</Anchor>
	);
}
