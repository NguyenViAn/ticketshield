import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";
import { fetchActivePromotions } from "@/lib/services/promotions";
import type { Promotion } from "@/types";

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

export function usePromotions() {
    const [data, setData] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const locale = useLocale();
    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;

        const fetchPromotions = async () => {
            try {
                const localized = await fetchActivePromotions(supabase, locale);

                if (isMounted) {
                    setData(localized);
                }
            } catch (err: unknown) {
                console.warn("Promotions fetch error:", getErrorMessage(err));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchPromotions();

        return () => {
            isMounted = false;
        };
    }, [locale, supabase]);

    return { data, isLoading };
}
