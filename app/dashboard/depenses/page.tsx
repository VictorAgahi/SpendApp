"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function Depenses() {
    const [name, setName] = useState("");
    const [initialPrice, setInitialPrice] = useState("");
    const [days, setDays] = useState("");
    const [renewable, setRenewable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        }
    }, [router]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name || !initialPrice || isNaN(Number(initialPrice)) || Number(initialPrice) <= 0 || isNaN(Number(days)) || Number(days) <= 0) {
            setError("Veuillez entrer un nom de dépense, un budget et un nombre de jours valide.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const deadline = new Date();
            deadline.setDate(deadline.getDate() + Number(days));

            const response = await fetch("/api/auth/depenses", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    initialPrice,
                    days,
                    deadline: deadline.toISOString(),
                    renewable,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/dashboard");
            } else {
                setError(data.message || "Erreur lors de la création de la dépense.");
            }
        } catch (error) {
            setError("Une erreur s'est produite lors de l'enregistrement de la dépense. --> " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center mt-2 ">
            <Card className="text-white p-6 rounded-lg shadow-lg max-w-md w-full text-center bg-transparent">
                <h1 className="text-4xl font-extrabold text-white mb-4">Ajouter une Dépense</h1>
                <p className="text-xl text-gray-300 mb-6">
                    Remplissez les informations ci-dessous pour enregistrer une nouvelle dépense.
                </p>

                {error && <div className="text-red-600 mt-2 text-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="mt-3 space-y-4">
                    <Input
                        type="text"
                        placeholder="Nom de la dépense"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <Input
                        type="number"
                        placeholder="Budget (€)"
                        value={initialPrice}
                        onChange={(e) => setInitialPrice(e.target.value)}
                        min="0"
                        className="w-full p-2 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <Input
                        type="number"
                        placeholder="Nombre de jours avant deadline"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        min="1"
                        className="w-full p-2 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <div className="flex items-center justify-between">
                        <label className="text-sm">Renouvelable</label>
                        <Switch checked={renewable} onCheckedChange={setRenewable} />
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? "Enregistrement..." : "Ajouter la Dépense"}
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