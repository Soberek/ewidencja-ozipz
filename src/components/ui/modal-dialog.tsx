import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalDialogSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  size?: ModalDialogSize;
  error?: string | null;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitText?: string;
  submitIcon?: React.ReactNode;
  cancelText?: string;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerAccent?: "primary" | "amber" | "emerald" | "blue" | "purple" | "rose" | "none";
}

const SIZE_CLASSES: Record<ModalDialogSize, string> = {
  sm: "sm:max-w-[460px]",
  md: "sm:max-w-[580px]",
  lg: "sm:max-w-[720px]",
  xl: "sm:max-w-[880px]",
  "2xl": "sm:max-w-[1060px]",
  full: "sm:max-w-[95vw] h-[92vh]",
};

const ACCENT_CLASSES: Record<NonNullable<ModalDialogProps["headerAccent"]>, { bg: string; iconBg: string; iconText: string }> = {
  primary: {
    bg: "bg-gradient-to-r from-primary/15 via-primary/5 to-transparent",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
  },
  amber: {
    bg: "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    bg: "bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    bg: "bg-gradient-to-r from-blue-500/15 via-blue-500/5 to-transparent",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    bg: "bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-transparent",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-600 dark:text-purple-400",
  },
  rose: {
    bg: "bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-400",
  },
  none: {
    bg: "bg-muted/10",
    iconBg: "bg-muted",
    iconText: "text-foreground",
  },
};

export function ModalDialog({
  isOpen,
  onClose,
  title,
  description,
  icon,
  badge,
  size = "md",
  error,
  children,
  onSubmit,
  isSubmitting = false,
  submitText = "Zapisz Zmiany",
  submitIcon = <CheckCircle2 className="size-3.5" />,
  cancelText = "Anuluj",
  footer,
  className,
  contentClassName,
  headerAccent = "primary",
}: ModalDialogProps) {
  const accent = ACCENT_CLASSES[headerAccent] || ACCENT_CLASSES.primary;
  const isForm = Boolean(onSubmit);

  const dialogHeaderContent = (
    <div className={cn("px-5 py-4 border-b border-border shrink-0 select-none", accent.bg)}>
      <DialogHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <div className={cn("p-2 rounded-[3px] border border-border/50 shrink-0", accent.iconBg, accent.iconText)}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight leading-snug">
                  {title}
                </DialogTitle>
                {badge}
              </div>
              {description && (
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </div>
      </DialogHeader>
    </div>
  );

  const errorBanner = error ? (
    <div role="alert" className="p-2.5 text-xs text-destructive bg-destructive/10 rounded-[3px] border border-destructive/20 font-medium flex items-center gap-2 mb-3 shrink-0">
      <AlertCircle className="size-4 shrink-0 text-destructive" />
      <span>{error}</span>
    </div>
  ) : null;

  const defaultFooter = (
    <DialogFooter className="p-3 px-5 border-t border-border bg-muted/30 flex items-center justify-end gap-2 shrink-0">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSubmitting}
      >
        {cancelText}
      </Button>
      {onSubmit && (
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px] font-bold">
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Zapisywanie...</span>
            </>
          ) : (
            <>
              {submitIcon}
              <span>{submitText}</span>
            </>
          )}
        </Button>
      )}
    </DialogFooter>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        closeDisabled={isSubmitting}
        className={cn(
          "p-0 overflow-hidden border border-border shadow-md max-h-[92vh] flex flex-col rounded-[4px] bg-card",
          SIZE_CLASSES[size],
          className
        )}
      >
        {dialogHeaderContent}

        {isForm ? (
          <form noValidate onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className={cn("p-5 overflow-y-auto flex-1 text-xs space-y-4", contentClassName)}>
              {errorBanner}
              {children}
            </div>
            {footer !== undefined ? footer : defaultFooter}
          </form>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className={cn("p-5 overflow-y-auto flex-1 text-xs space-y-4", contentClassName)}>
              {errorBanner}
              {children}
            </div>
            {footer !== undefined ? footer : defaultFooter}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
