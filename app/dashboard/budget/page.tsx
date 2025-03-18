"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Budget() {
    const [amount, setAmount] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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
        }
    };

    return (
        <div className="w-full h-[calc(120vh-20rem)] flex items-center justify-center">
            <Card className="w-full max-w-screen-lg min-h-[500px] bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-full flex flex-col p-6 sm:p-8 space-y-6 overflow-y-auto">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                        Mettez à jour votre solde bancaire
                    </h1>

                    {/* Description avec texte responsive */}
                    <p className="text-base sm:text-lg md:text-xl text-gray-300">
                        Pour mieux gérer votre budget, veuillez entrer le montant d&#39;argent
                        que vous avez actuellement dans votre compte en banque.
                        <br /><br />
                        Ce montant nous aidera à vous offrir une expérience personnalisée
                        et à suivre vos finances plus efficacement.
                    </p>

                    {error && <div className="text-red-600 text-lg">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Input avec texte responsive */}
                        <Input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Entrez un montant"
                            className="w-full p-4 text-lg border-2 border-gray-600 rounded-xl bg-gray-700 focus:border-blue-500"
                        />

                        {/* Bouton avec texte responsive */}
                        <Button
                            type="submit"
                            className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700 transition-transform"
                        >
                            Mettre à jour le solde
                        </Button>
                    </form>

                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="w-full py-3 bg-gray-700 hover:bg-gray-600 border border-gray-500"
                    >
                        Retour au dashboard
                    </Button>
                </div>
            </Card>
        </div>
    );
}