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
    <div className="mt-6 flex justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        className="cursor-pointer"
      >
        {cancelText}
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="cursor-pointer"
      >
        {saveText}
      </Button>
    </div>
  );
}
