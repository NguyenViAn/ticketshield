import { useState, useEffect } from "react";
import { TicketWithMatch } from "@/types";
import { createClient } from "@/utils/supabase/client";

export function useTickets() {
    const [data, setData] = useState<TicketWithMatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;

        const fetchTickets = async () => {
            setIsLoading(true);
            try {
                // Get the currently authenticated user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) throw new Error("Authentication required to view tickets.");

                // Query tickets and join matches data natively in Supabase
                const { data: fetchResult, error: dbError } = await supabase
                    .from('tickets')
                    .select('*, matches(*, tournaments(name))')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (dbError) throw dbError;

                if (isMounted) {
                    setData(fetchResult as unknown as TicketWithMatch[]);
                    setError(null);
                }

            } catch (err: any) {
                if (isMounted) {
                    console.warn("Supabase tickets fetch error:", err?.message || err);
                    setError(err?.message || "Failed to establish secure connection.");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchTickets();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { data, isLoading, error };
}
