import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";

export interface PromotionRow {
    id: string;
    title_vi: string;
    title_en: string;
    description_vi: string;
    description_en: string;
    discount: string;
    gradient_code: string;
    active: boolean;
}

export interface LocalizedPromotion {
    id: string;
    title: string;
    description: string;
    discount: string;
    gradientCode: string;
}

export function usePromotions() {
    const [data, setData] = useState<LocalizedPromotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const locale = useLocale();
    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;

        const fetchPromotions = async () => {
            try {
                const { data: result, error } = await supabase
                    .from('promotions')
                    .select('*')
                    .eq('active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (isMounted && result) {
                    const localized: LocalizedPromotion[] = result.map((row: PromotionRow) => ({
                        id: row.id,
                        title: locale === 'vi' ? row.title_vi : row.title_en,
                        description: locale === 'vi' ? row.description_vi : row.description_en,
                        discount: row.discount,
                        gradientCode: row.gradient_code,
                    }));
                    setData(localized);
                }
            } catch (err: any) {
                console.warn("Promotions fetch error:", err?.message || err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchPromotions();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale]);

    return { data, isLoading };
}
