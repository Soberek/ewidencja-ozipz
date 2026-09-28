import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TargetsDistributeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  progActions: number;
  onProgActionsChange: (val: number) => void;
  progRecipients: number;
  onProgRecipientsChange: (val: number) => void;
  otherActions: number;
  onOtherActionsChange: (val: number) => void;
  otherRecipients: number;
  onOtherRecipientsChange: (val: number) => void;
  onDistribute: () => void;
}

export function TargetsDistributeDialog({
  isOpen,
  onClose,
  year,
  progActions,
  onProgActionsChange,
  progRecipients,
  onProgRecipientsChange,
  otherActions,
  onOtherActionsChange,
  otherRecipients,
  onOtherRecipientsChange,
  onDistribute,
}: TargetsDistributeDialogProps) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Równomierne rozdzielenie celów (${year})`}
      description="Wprowadź łączne roczne cele dla stacji. Wartości zostaną równomiernie podzielone na 12 miesięcy."
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              Działania programowe (rocznie):
            </label>
            <Input
              type="number"
              min={0}
              value={progActions}
              onChange={(e) => onProgActionsChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="text-xs h-9 font-mono"
            />
            <p className="text-[10px] text-muted-foreground">~{Math.round(progActions / 12)} / mies.</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              Odbiorcy programowi (rocznie):
            </label>
            <Input
              type="number"
              min={0}
              value={progRecipients}
              onChange={(e) => onProgRecipientsChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="text-xs h-9 font-mono"
            />
            <p className="text-[10px] text-muted-foreground">~{Math.round(progRecipients / 12)} / mies.</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              Inne działania (rocznie):
            </label>
            <Input
              type="number"
              min={0}
              value={otherActions}
              onChange={(e) => onOtherActionsChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="text-xs h-9 font-mono"
            />
            <p className="text-[10px] text-muted-foreground">~{Math.round(otherActions / 12)} / mies.</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              Inni odbiorcy (rocznie):
            </label>
            <Input
              type="number"
              min={0}
              value={otherRecipients}
              onChange={(e) => onOtherRecipientsChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="text-xs h-9 font-mono"
            />
            <p className="text-[10px] text-muted-foreground">~{Math.round(otherRecipients / 12)} / mies.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Anuluj
          </Button>
          <Button size="sm" onClick={onDistribute} className="text-xs font-semibold">
            Zastosuj podział
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}
