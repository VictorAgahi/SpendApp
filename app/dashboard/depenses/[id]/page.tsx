"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExpenseDTO } from "@/model/expenseDTO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function EditExpense() {
    const [expense, setExpense] = useState<ExpenseDTO>();
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(0);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        const fetchExpenseData = async () => {
            if (!id) return;

            try {
                const response = await fetch(`/api/auth/depenses/${id}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                if (!response.ok) throw new Error("Erreur de récupération des données");

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

        try {
            const response = await fetch(`/api/auth/depenses/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(expense),
            });

            if (!response.ok) throw new Error("Échec de la mise à jour");

            router.push("/dashboard");
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la dépense:", error);
        }
    };

    const handleModifyAmount = (modifier: number) => {
        if (!expense) return;
        const newPrice = parseFloat(expense.currentPrice) + modifier;
        setExpense({ ...expense, currentPrice: newPrice.toFixed(2) });
    };

    if (loading) return <div className="text-center mt-10 text-gray-300">Chargement...</div>;
    if (!expense) return <div className="text-center mt-10 text-red-500">Dépense non trouvée.</div>;

    return (
        <div className="justify-center min-h-screen flex flex-col items-center bg-gradient-to-r from-gray-900 to-gray-700 p-6">
            <Card className="w-full max-w-lg bg-white bg-opacity-10 backdrop-blur-md shadow-xl text-white">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Modifier la Dépense</CardTitle>
                </CardHeader>
                <CardContent>
                    <Label className="block mb-2">Nom de la dépense</Label>
                    <Input
                        type="text"
                        value={expense.name}
                        onChange={(e) => setExpense({ ...expense, name: e.target.value })}
                        className="mb-4 bg-gray-800 text-white border-gray-600"
                    />

                    <p className="text-lg">Prix initial : {parseFloat(expense.initialPrice).toFixed(2)} €</p>
                    <p className="text-lg">Prix actuel : {parseFloat(expense.currentPrice).toFixed(2)} €</p>

                    <Label className="block mt-4 mb-2">Montant à ajouter ou retirer</Label>
                    <Input
                        type="number"
                        value={amount === 0 ? "" : amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="mb-4 bg-gray-800 text-white border-gray-600"
                    />

                    <div className="flex justify-between mb-4">
                        <Button onClick={() => handleModifyAmount(amount)} className="bg-green-500 hover:bg-green-600">
                            Ajouter
                        </Button>
                        <Button onClick={() => handleModifyAmount(-amount)} className="bg-yellow-500 hover:bg-yellow-600">
                            Retirer
                        </Button>
                    </div>

                    <Label className="block mt-4 mb-2">Date limite</Label>
                    <Input
                        type="date"
                        value={format(new Date(expense.deadline), "yyyy-MM-dd")}
                        onChange={(e) => setExpense({ ...expense, deadline: e.target.value })}
                        className="w-full bg-gray-800 text-white border-gray-600"
                    />

                    <div className="flex justify-between mt-6">
                        <Button onClick={handleUpdateExpense} className="bg-blue-500 hover:bg-blue-600">
                            Mettre à jour
                        </Button>
                        <Button onClick={() => router.push("/dashboard")} className="bg-gray-500 hover:bg-gray-600">
                            Annuler
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}