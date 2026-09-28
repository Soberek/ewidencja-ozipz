import { toast } from "sonner";

export interface RunModalActionOptions {
  rethrow?: boolean;
}

export async function runModalAction<T>(
  action: () => Promise<T>,
  successMessage: string,
  errorMessage: string,
  onSuccess?: () => void,
  options?: RunModalActionOptions
): Promise<T | undefined> {
  try {
    const result = await action();
    toast.success(successMessage);
    onSuccess?.();
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Błąd operacji";
    toast.error(`${errorMessage}: ${msg}`);
    if (options?.rethrow) {
      throw err;
    }
    return undefined;
  }
}
