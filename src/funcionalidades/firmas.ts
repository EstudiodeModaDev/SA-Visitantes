import * as React from "react";
import type { FirmasService } from "../services/Firma.service";


export function useFirmaById(firmas: FirmasService) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadById = React.useCallback(async (firmaId: string) => {
    setLoading(true);
    setError(null);

    try {
      const blob = await firmas.downloadFileById(firmaId);
      const objectUrl = URL.createObjectURL(blob);

      return {
        blob,
        objectUrl,
        revoke: () => URL.revokeObjectURL(objectUrl),
      };
    } catch (e: any) {
      setError(e?.message ?? "Error cargando firma");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [firmas]);

  return { loading, error, loadById };
}
