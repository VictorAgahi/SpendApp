"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WalletCards, CalendarIcon, Repeat } from "lucide-react";

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
        if (Number(initialPrice) > 100000) {
            setError("Fait un credit ca ira plus vite");
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
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <WalletCards className="h-8 w-8 text-blue-400" />
                    <h1 className="text-3xl font-bold tracking-tight">Ajouter une Dépense</h1>
                </div>

                <p className="text-gray-300 mb-8">Remplissez les informations ci-dessous pour enregistrer une nouvelle dépense.</p>

                {error && (
                    <div className="p-3 bg-red-500/20 text-red-300 rounded-lg border border-red-500/50 mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-gray-300 flex items-center gap-2">
                            <WalletCards className="h-4 w-4" />
                            Nom de la dépense
                        </Label>
                        <Input
                            type="text"
                            placeholder="Ex: Courses"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-700 border-gray-600 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Budget (€)</Label>
                        <Input
                            type="number"
                            placeholder="0,00"
                            value={initialPrice}
                            onChange={(e) => setInitialPrice(e.target.value)}
                            className="bg-gray-700 border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Nombre de jours avant deadline
                        </Label>
                        <Input
                            type="number"
                            placeholder="Ex: 7"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            min="1"
                            className="bg-gray-700 border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                        <Label className="text-gray-300 flex items-center gap-2">
                            <Repeat className="h-4 w-4" />
                            Renouvelable
                        </Label>
                        <Switch
                            checked={renewable}
                            onCheckedChange={setRenewable}
                            className="data-[state=checked]:bg-blue-500"
                        />
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row-reverse md:justify-between">
                        <Button
                            type="submit"
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? "Enregistrement..." : "Ajouter la Dépense"}
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