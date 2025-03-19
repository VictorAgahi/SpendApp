"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

enum TYPE {
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
}

export default function Salaire() {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState<TYPE>(TYPE.MONTHLY);
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
        if (!name || !price || isNaN(Number(price)) || Number(price) <= 0) {
            setError("Veuillez entrer un nom et un montant valide.");
            return;
        }
        if (Number(price) >= 100000)
        {
            setError("Chef tu te voiles la face");
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

            const deadline = new Date().toISOString();

            const response = await fetch("/api/auth/salaire", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    price: Number(price),
                    duration,
                    deadline,
                    renewable,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/dashboard");
            } else {
                setError(data.message || "Erreur lors de l'ajout du salaire.");
            }
        } catch (error) {
            setError("Une erreur s'est produite lors de l'enregistrement du salaire. " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-[calc(120vh-20rem)] flex items-center justify-center">
            <Card className="w-full max-w-screen-lg min-h-[500px] bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden p-8">
                    <h1 className="text-4xl font-extrabold text-white mb-4">Ajouter un Salaire</h1>
                    <p className="text-xl text-gray-300 mb-6">
                        Remplissez les informations ci-dessous pour enregistrer un nouveau salaire.
                    </p>

                    {error && <div className="text-red-600 mt-2 text-lg">{error}</div>}

                    <form onSubmit={handleSubmit} className="mt-3 space-y-4">
                        <Input
                            type="text"
                            placeholder="Nom du salaire"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />

                        <Input
                            type="number"
                            placeholder="Montant (€)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0"
                            className="w-full p-2 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />

                        <div className="flex items-center justify-between">
                            <label className="text-sm">Fréquence</label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value as TYPE)}
                                className="p-2 bg-gray-800 text-white rounded-lg"
                            >
                                <option value={TYPE.MONTHLY}>Mensuel</option>
                                <option value={TYPE.WEEKLY}>Hebdomadaire</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm">Renouvelable</label>
                            <Switch checked={renewable} onCheckedChange={setRenewable} />
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
                            disabled={loading}
                        >
                            {loading ? "Enregistrement..." : "Ajouter le Salaire"}
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
    );
}