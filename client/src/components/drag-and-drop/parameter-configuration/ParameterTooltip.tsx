import Tooltip from "@mui/material/Tooltip";
import { ReactElement } from "react";

interface ParameterTooltipProps {
  description?: string | null;
  children: ReactElement;
}

export const ParameterTooltip = ({
  description,
  children,
}: ParameterTooltipProps) => {
  if (!description) return <>{children}</>;

  return (
    <Tooltip
      title={description}
      arrow
      placement="left"
      slotProps={{
        popper: {
          modifiers: [{ name: "offset", options: { offset: [0, -8] } }],
        },
      }}
    >
      {children}
    </Tooltip>
  );
};
