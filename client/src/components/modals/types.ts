export type GenericModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
  title: string;
  content?: React.ReactNode;
  loading?: boolean;
};
