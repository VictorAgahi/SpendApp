"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { CalendarIcon, WalletCards, Repeat, BadgeEuro } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

enum TYPE {
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    NONE = "NONE",
}

enum PAYMENT_TYPE {
    TRANSFER = "TRANSFER",
    INCOME = "INCOME",
    SALARY = "SALARY",
}

export default function Salaire() {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [paymentType, setPaymentType] = useState<PAYMENT_TYPE>(PAYMENT_TYPE.TRANSFER);
    const [duration, setDuration] = useState<TYPE>(TYPE.WEEKLY);
    const [renewable, setRenewable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
        if (Number(price) >= 100000) {
            setError("Chef tu te voiles la face");
            return;
        }
        if (paymentType == PAYMENT_TYPE.SALARY && date != null && date.getTime() < new Date().getTime()) {
            setError("Un salaire ne peut pas venir du passer, aller update votre compte dans Budget");
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

            const deadline = date ? date.toISOString() : new Date().toISOString();

            const response = await fetch("/api/auth/salaire", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    price: Number(price),
                    type: paymentType,
                    date: date ? new Date(date) : null,
                    duration: paymentType === PAYMENT_TYPE.SALARY ? duration : TYPE.NONE,
                    renewable: paymentType === PAYMENT_TYPE.SALARY ? renewable : false,
                    deadline,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/dashboard");
            } else {
                setError(data.message || "Erreur lors de l'ajout.");
            }
        } catch (error) {
            setError("Une erreur s'est produite lors de l'enregistrement. " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <WalletCards className="h-8 w-8 text-blue-400" />
                    <h1 className="text-3xl font-bold tracking-tight">Ajouter un Paiement</h1>
                </div>

                <p className="text-gray-300 mb-8">Sélectionnez un type de paiement et remplissez les informations.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">

                        <div className="space-y-2">
                            <Label className="text-gray-300 flex items-center ">
                                <BadgeEuro className="h-4 w-4" />
                                Nom du paiement
                            </Label>
                            <Input
                                type="text"
                                placeholder="Ex: Salaire Mars"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-gray-700 border-gray-600 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300"><BadgeEuro className="h-4 w-4" /> Montant </Label>
                            <Input
                                type="number"
                                placeholder="0,00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="bg-gray-700 border-gray-600
                                 [appearance:textfield]
                                 [&::-webkit-outer-spin-button]:appearance-none
                                [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-white">Type de paiement</Label>
                            <Select
                                value={paymentType}
                                onValueChange={(value: PAYMENT_TYPE) => setPaymentType(value)}
                            >
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                    <SelectValue placeholder="Sélectionnez un type" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600 text-white">
                                    <SelectItem value={PAYMENT_TYPE.TRANSFER} className="hover:bg-gray-700 text-white">
                                        Virement envoyé
                                    </SelectItem>
                                    <SelectItem value={PAYMENT_TYPE.INCOME} className="hover:bg-gray-700 text-white">
                                        Virement reçu
                                    </SelectItem>
                                    <SelectItem value={PAYMENT_TYPE.SALARY} className="hover:bg-gray-700 text-white">
                                        Salaire
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentType === PAYMENT_TYPE.SALARY && (
                            <div className="space-y-2">
                                <Label className="text-gray-300 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Date
                                </Label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                        >
                                            {date ? format(date, "dd/MM/yyyy") : "Sélectionnez une date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(selectedDate) => {
                                                setDate(selectedDate);
                                                setIsCalendarOpen(false); // Fermer le calendrier après sélection
                                            }}
                                            className="text-white"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>

                    {paymentType === PAYMENT_TYPE.SALARY && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Fréquence</Label>
                                <Select
                                    value={duration}
                                    onValueChange={(value: TYPE) => setDuration(value)}
                                >
                                    <SelectTrigger className="bg-gray-700 border-gray-600">
                                        <SelectValue placeholder="Sélectionnez une fréquence" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600">
                                        <SelectItem value={TYPE.WEEKLY} className="hover:bg-gray-700">
                                            Hebdomadaire
                                        </SelectItem>
                                        <SelectItem value={TYPE.MONTHLY} className="hover:bg-gray-700">
                                            Mensuel
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
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
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/20 text-red-300 rounded-lg border border-red-500/50">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 md:flex-row-reverse md:justify-between">
                        <Button
                            type="submit"
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? "Enregistrement..." : "Ajouter le Paiement"}
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="outline"
                            size="lg"
                            className="w-full md:w-auto bg-blackborder-gray-600 text-white hover:bg-white/50"
                        >
                            Retour au dashboard
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}