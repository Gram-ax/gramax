import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import { Fragment, ReactElement } from "react";
import Link from "../Atoms/Link";

interface BreadcrumbProps {
	content: { text: string; link?: BaseLink; onClick?: () => void }[];
	title?: string;
	middleDots?: boolean;
	className?: string;
}

const Breadcrumb = (props: BreadcrumbProps): ReactElement => {
	const { title, content, middleDots = true, className } = props;

	return (
		<div className={`${className} breadcrumb`}>
			{title && (
				<div className="title">
					<span>{title}</span>
				</div>
			)}
			{content.map((c, i) => {
				const isFirst = i == 0;
				const correctLength = content.length > 2;
				const isNotLast = content.length !== i + 1;
				const isMiddleDots = middleDots && correctLength ? i !== 0 && isNotLast : false;
				const text = <span className="text">{c.text}</span>;
				return (
					<Fragment key={i}>
						{!isMiddleDots && (
							<>
								<div className="link" onClick={c.onClick} key={i + "link"}>
									{c.link ? <Link href={c.link}>{text}</Link> : text}
								</div>
								{isNotLast && content.length > 1 && (
									<span key={i + "divider"} className="divider">
										{"/"}
									</span>
								)}
							</>
						)}
						{isFirst && correctLength && middleDots && (
							<>
								<span key={i + "dots"} className="dots">
									...
								</span>
								<span key={i + "divider-2"} className="divider">
									{"/"}
								</span>
							</>
						)}
					</Fragment>
				);
			})}
		</div>
	);
};

export default styled(Breadcrumb)`
	display: flex;
	font-size: 12px;
	font-weight: 400;
	align-items: center;
	flex-direction: row;
	justify-content: flex-start;
	color: var(--color-primary-general);

	.title {
		font-weight: 700;
		line-height: 100%;
	}

	a {
		max-width: 100%;
		display: flex;
		align-items: baseline;
		color: var(--color-primary-general) !important;
		text-decoration: none !important;
	}

	a:hover {
		color: var(--color-primary) !important;
	}

	.link {
		gap: 0.26rem;
		display: flex;
		line-height: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;

		.text {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	.divider {
		padding: 0 0.26rem;
	}

	.dots {
		word-break: normal;
	}

	${cssMedia.narrow} {
		margin-top: 1rem;
	}
`;
