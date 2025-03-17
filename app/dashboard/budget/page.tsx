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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 to-gray-700 p-6 sm:p-8 md:p-12">
            <div className="max-w-md w-full text-center">
                <Card className="bg-opacity-80 bg-gray-800 text-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-4xl font-extrabold text-white mb-4">Mettez à jour votre solde bancaire</h1>
                    <p className="text-xl text-gray-300 mb-6">
                        Pour mieux gérer votre budget, veuillez entrer le montant d&#39;argent que vous avez actuellement dans votre compte en banque.
                        <br />
                        Ce montant nous aidera à vous offrir une expérience personnalisée et à suivre vos finances plus efficacement.
                    </p>

                    {error && <div className="text-red-600 mt-2 text-lg">{error}</div>}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <Input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Entrez un montant"
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />

                        <Button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
                        >
                            Mettre à jour le solde
                        </Button>
                    </form>

                    <div className="mt-6 space-y-2">
                        <Button
                            onClick={() => router.push("/dashboard")}
                            className="w-full py-2 text-white bg-black border border-gray-300 rounded-lg hover:bg-gray-700 transition transform hover:scale-105"
                        >
                            Retour au dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
