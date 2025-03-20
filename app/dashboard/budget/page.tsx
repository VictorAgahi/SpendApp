"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletCards } from "lucide-react";

export default function Budget() {
    const [amount, setAmount] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Veuillez entrer un montant valide.");
            return;
        }
        if (parsedAmount >= 1000000) {
            setError("T'es pas Elon Musk chef");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const response = await fetch("/api/auth/budget", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ parsedAmount }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/dashboard");
            } else {
                setError(data.message || "Une erreur s'est produite lors de la mise à jour.");
            }
        } catch (err) {
            console.error(err);
            setError("Une erreur s'est produite lors de la connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <WalletCards className="h-8 w-8 text-blue-400" />
                    <h1 className="text-3xl font-bold tracking-tight">Mettez à jour votre solde bancaire</h1>
                </div>

                <p className="text-gray-300 mb-8">
                    Pour mieux gérer votre budget, veuillez entrer le montant d&#39;argent
                    que vous avez actuellement dans votre compte en banque.
                    <br /><br />
                    Ce montant nous aidera à vous offrir une expérience personnalisée
                    et à suivre vos finances plus efficacement.
                </p>

                {error && (
                    <div className="p-3 bg-red-500/20 text-red-300 rounded-lg border border-red-500/50 mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-gray-300 flex items-center gap-2">
                            <WalletCards className="h-4 w-4" />
                            Montant
                        </Label>
                        <Input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Entrez un montant"
                            className="bg-gray-700 border-gray-600 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row-reverse md:justify-between">
                        <Button
                            type="submit"
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? "Chargement..." : "Mettre à jour le solde"}
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="outline"
                            size="lg"
                            className="w-full md:w-auto bg-black border-gray-600 text-white hover:bg-white/50"
                        >
                            Retour au dashboard
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}