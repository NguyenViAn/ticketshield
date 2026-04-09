import { useEffect, useLayoutEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";
import { fetchActivePromotions } from "@/lib/services/promotions";
import type { Promotion } from "@/types";

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

function getPromotionsCacheKey(locale: string) {
    return `ticketshield:promotions:${locale}`;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

export function usePromotions(initialData?: Promotion[]) {
    const [data, setData] = useState<Promotion[]>(initialData ?? []);
    const [isLoading, setIsLoading] = useState(() => initialData === undefined);
    const locale = useLocale();
    const supabase = createClient();

    useIsomorphicLayoutEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const cachedPromotions = window.sessionStorage.getItem(getPromotionsCacheKey(locale));

        if (!cachedPromotions) {
            return;
        }

        try {
            const parsedPromotions = JSON.parse(cachedPromotions) as Promotion[];
            setData(parsedPromotions);
            setIsLoading(false);
        } catch {
            window.sessionStorage.removeItem(getPromotionsCacheKey(locale));
        }
    }, [locale]);

    useEffect(() => {
        let isMounted = true;

        const fetchPromotions = async () => {
            try {
                const localized = await fetchActivePromotions(supabase, locale);

                if (isMounted) {
                    setData(localized);
                    if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(
                            getPromotionsCacheKey(locale),
                            JSON.stringify(localized),
                        );
                    }
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
