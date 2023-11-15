import styled from "@emotion/styled";

const GitHubUser = styled(({ avatarUrl, name, className }: { avatarUrl: string; name: string; className?: string }) => {
	return (
		<div className={className}>
			<img src={avatarUrl} />
			<span>{name}</span>
		</div>
	);
})`
	display: flex;
	align-items: center;
	gap: var(--distance-i-span);

	> img {
		height: 19px;
		display: inline;
		min-width: 19px;
		min-height: 19px;
		border-radius: 1rem;
	}
`;

export default GitHubUser;
