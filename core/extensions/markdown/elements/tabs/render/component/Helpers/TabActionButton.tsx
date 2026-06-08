import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import styled from "@emotion/styled";

const TabActionButton = styled(TooltipIconButton)`
    color: hsl(var(--muted));

    &:hover {
        color: hsl(var(--primary-fg));
    }
`;

export default TabActionButton;
