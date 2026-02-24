import { SeatMapRadial } from "@/components/seat-map-radial";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SeatsPage({ params }: { params: { matchId: string } }) {
    // Normally we would fetch match data using matchId
    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <Link href="/matches" className="inline-flex items-center text-neon-cyan hover:text-white transition-colors text-sm font-heading mb-6 tracking-widest uppercase">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Abort Selection (Return)
                </Link>
                <h1 className="text-3xl md:text-5xl font-heading font-black text-white">
                    SECTOR <span className="text-neon-cyan neon-text-cyan">{params.matchId}</span>
                </h1>
                <p className="text-gray-400 mt-2 font-mono text-sm uppercase">Active Anomaly Tracking: Optimal</p>
            </div>

            <div className="mt-12">
                <SeatMapRadial />
            </div>
        </main>
    );
}
