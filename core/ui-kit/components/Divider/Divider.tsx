// @ts-ignore
// export { Divider } from "ics-ui-kit/components/Divider";
// Даже ts-ignore не помог, пишет что файла не существует, хотя в дев запуске все норм, пришлось вот так сделать:

import styled from "@emotion/styled";

export const Divider = () => {
	return <div className="h-px w-full bg-secondary-border" />;
};

export const DescriptionDivider = styled(({ description, className }: { description: string; className?: string }) => {
	return (
		<div className={className}>
			<Divider />
			<div className={"description"}>{description}</div>
			<Divider />
		</div>
	);
})`
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	vertical-align: middle;
	gap: 0.5rem;

	.description {
		width: 100%;
		white-space: nowrap;
		line-height: 1.25rem;
		color: hsla(215, 16%, 47%, 1);
		letter-spacing: 0;
		font-weight: 400;
		font-family: inherit;
		font-size: 14px;
		text-align: center;
	}
`;
