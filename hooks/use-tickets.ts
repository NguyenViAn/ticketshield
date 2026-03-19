import { useCallback, useEffect, useState } from "react";

import { TicketWithMatch } from "@/types";
import { fetchUserTickets } from "@/lib/services/tickets";
import { createClient } from "@/utils/supabase/client";

export function useTickets() {
  const [data, setData] = useState<TicketWithMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const refetch = useCallback(async () => {
    setIsLoading(true);

    try {
      setData(await fetchUserTickets(supabase));
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to establish secure connection.";
      console.warn("Supabase tickets fetch error:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
