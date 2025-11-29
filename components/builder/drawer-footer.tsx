import { Button } from '@/components/ui/button';

interface DrawerFooterProps {
  onSave: () => void;
  onCancel: () => void;
  saveDisabled?: boolean;
  saveText?: string;
  cancelText?: string;
}

export function DrawerFooter({
  onSave,
  onCancel,
  saveDisabled = false,
  saveText = 'Salvar',
  cancelText = 'Cancelar',
}: DrawerFooterProps) {
  return (
    <div className="flex gap-3 w-full">
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        className="cursor-pointer flex-1"
      >
        {cancelText}
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="cursor-pointer flex-1"
      >
        {saveText}
      </Button>
    </div>
  );
}
