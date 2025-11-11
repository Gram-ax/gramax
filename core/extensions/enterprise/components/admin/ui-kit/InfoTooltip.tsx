import React from "react";
import { IconTooltip } from "@ui-kit/IconTooltip";

type InfoTooltipProps = {
	content: React.ReactNode;
	className?: string;
};

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className }) => {
	return <IconTooltip content={content} icon="info" iconSize="lg" className={className} />;
};
