"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExpenseDTO } from "@/model/expenseDTO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { WalletCards } from "lucide-react";

export default function EditExpense() {
    const [expense, setExpense] = useState<ExpenseDTO>();
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        const fetchExpenseData = async () => {
            setError(null);
            setLoading(true);

            if (!id) return;

            try {
                const response = await fetch(`/api/auth/depenses/${id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Erreur de récupération des données");
                }

                const data = await response.json();
                setExpense(data);
            } catch (error) {
                console.error("Erreur lors de la récupération de la dépense:", error);
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchExpenseData();
    }, [id, router]);

    const handleUpdateExpense = async () => {
        if (!expense) return;

        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`/api/auth/depenses/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(expense),
            });

            if (!response.ok) {
                throw new Error("Échec de la mise à jour");
            }

            // Redirection si la mise à jour est OK
            router.push("/dashboard");
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la dépense:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModifyAmount = (modifier: number) => {
        if (!expense) return;

        setError(null);

        // Limite arbitraire pour éviter les grosses valeurs
        if (modifier > 100000 || modifier < -100000) {
            setError("Montant trop important ou trop faible.");
            return;
        }

        // Conversion et mise à jour du currentPrice
        const newPrice = parseFloat(expense.currentPrice) + modifier;
        setExpense({ ...expense, currentPrice: newPrice.toFixed(2) });

        // On réinitialise le champ amount
        setAmount(0);
    };

    if (loading) {
        return <div className="text-center mt-10 text-gray-300">Chargement...</div>;
    }

    if (!expense) {
        return <div className="text-center mt-10 text-red-500">Dépense non trouvée.</div>;
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-8">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-6">
                        <WalletCards className="h-8 w-8 text-blue-400" />
                        <CardTitle className="text-3xl font-bold">Modifier la Dépense</CardTitle>
                    </div>
                </CardHeader>

                {error && (
                    <div className="p-3 bg-red-500/20 text-red-300 rounded-lg border border-red-500/50 mb-6">
                        {error}
                    </div>
                )}

                <CardContent>
                    <div className="space-y-6">
                        {/* Nom de la dépense */}
                        <div className="space-y-2">
                            <Label className="text-gray-300 flex items-center gap-2">
                                <WalletCards className="h-4 w-4" />
                                Nom de la dépense
                            </Label>
                            <Input
                                type="text"
                                value={expense.name}
                                onChange={(e) => setExpense({ ...expense, name: e.target.value })}
                                className="bg-gray-700 border-gray-600 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Prix initial */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Prix initial</Label>
                            <p className="text-lg">
                                {parseFloat(expense.initialPrice).toFixed(2)} €
                            </p>
                        </div>

                        {/* Prix actuel */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Prix actuel</Label>
                            <p className="text-lg">
                                {parseFloat(expense.currentPrice).toFixed(2)} €
                            </p>
                        </div>

                        {/* Montant à ajouter ou retirer */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Montant à ajouter ou retirer</Label>
                            <Input
                                type="number"
                                value={amount === 0 ? "" : amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="bg-gray-700 border-gray-600 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex justify-between gap-4">
                            <Button
                                onClick={() => handleModifyAmount(amount)}
                                className=" bg-green-600 hover:bg-green-700"
                            >
                                Ajouter
                            </Button>
                            <Button
                                onClick={() => handleModifyAmount(-amount)}
                                className=" bg-red-600 hover:bg-red-700"
                            >
                                Retirer
                            </Button>
                        </div>

                        {/* Date limite */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Date limite</Label>
                            <Input
                                type="date"
                                value={
                                    expense.deadline
                                        ? format(new Date(expense.deadline), "yyyy-MM-dd")
                                        : ""
                                }
                                onChange={(e) =>
                                    setExpense({ ...expense, deadline: e.target.value })
                                }
                                className="bg-gray-700 border-gray-600"
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex justify-between gap-4">
                            <Button
                                onClick={handleUpdateExpense}
                                className=" bg-blue-600 hover:bg-blue-700"
                                disabled={loading}
                            >
                                {loading ? "Mise à jour..." : "Mettre à jour"}
                            </Button>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className=" bg-gray-700 hover:bg-gray-600"
                            >
                                Annuler
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
