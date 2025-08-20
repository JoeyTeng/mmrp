import { Button, Typography } from "@mui/material";
import { toast } from "react-toastify/unstyled";

type CopyableToastProps = {
  message: string;
};

export const CopyableToast: React.FC<CopyableToastProps> = ({ message }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col space-y-2">
      <Typography variant="body2" className="select-text cursor-text text-sm">
        {message}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={copyToClipboard}
        className="self-end text-primary border-gray-300 normal-case"
      >
        Copy Text
      </Button>
    </div>
  );
};
