import styled from "@emotion/styled";
import type { HTMLAttributes } from "react";

const MediaDescriptionUnstyled = (props: HTMLAttributes<HTMLDivElement>) => {
	const { className, ...rest } = props;
	return <div className={className} {...rest} />;
};

export const MediaDescription = styled(MediaDescriptionUnstyled)`
    position: absolute;
    bottom: 5%;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    margin-top: 1em;
    color: var(--color-active-white) !important;
    font-size: 1em !important;
    z-index: var(--z-index-article-modal);
`;
