"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
    id: string;
    name: string;
    balance: number;
    email?: string;
    avatarUrl?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const locale = useLocale();
    const supabase = useMemo(() => createClient(), []);

    // Map Supabase User to App User
    const mapUser = (su: SupabaseUser | null): User | null => {
        if (!su) return null;
        return {
            id: su.id,
            name: su.user_metadata?.full_name || su.email?.split('@')[0] || "Agent 47",
            email: su.email,
            balance: su.user_metadata?.balance || 2500000,
            avatarUrl: su.user_metadata?.avatar_url || null,
        };
    };

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(mapUser(session?.user ?? null));
            setIsLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(mapUser(session?.user ?? null));
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);


    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setIsLoading(false);
        router.push(`/${locale}/login`);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
