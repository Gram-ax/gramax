import Date from "@components/Atoms/Date";
import styled from "@emotion/styled";
import { Accent, Author } from "@ext/git/core/GitMergeRequest/components/Elements";
import type { Signature } from "@ext/git/core/model/Signature";
import t from "@ext/localization/locale/translate";

const Wrapper = styled.span<{ padding?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.33em;
	${({ padding }) => padding && "padding-top: 4px; padding-bottom: 4px;"}
	text-overflow: ellipsis;
	white-space: nowrap;

	> *:not(:last-of-type)::after {
		content: "/";
		color: var(--color-merge-request-text);
	}
`;

const Creator = ({ from, created }: { from: Signature; created: Date }) => {
	return (
		<Wrapper padding>
			<Wrapper style={{ maxWidth: "70%", overflow: "hidden" }}>
				{t("git.merge-requests.by")}
				<Author author={from} />
			</Wrapper>
			<Wrapper style={{ maxWidth: "100%", overflow: "hidden" }}>
				<Accent bold>
					<Date date={created?.toString()} />
				</Accent>
			</Wrapper>
		</Wrapper>
	);
};

export default Creator;
