"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            setError("Une erreur s'est produite lors de l'enregistrement de la dépense.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-gray-900 to-gray-800 p-6 md:p-12 transition-all">
            <h1 className="text-4xl font-bold text-center text-white mb-8">Ajouter une Dépense</h1>

            <Card className="bg-gray-900 text-white shadow-xl w-full max-w-md">
                <CardHeader>
                    <CardTitle>Nouvelle Dépense</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Nom de la dépense"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <Input
                            type="number"
                            placeholder="Budget (€)"
                            value={initialPrice}
                            onChange={(e) => setInitialPrice(e.target.value)}
                            required
                            min="0"
                        />

                        <Input
                            type="number"
                            placeholder="Nombre de jours avant deadline"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            required
                            min="1"
                        />

                        <div className="flex items-center justify-between">
                            <label className="text-sm">Renouvelable</label>
                            <Switch checked={renewable} onCheckedChange={setRenewable} />
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? "Enregistrement..." : "Ajouter la Dépense"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}