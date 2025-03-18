"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserDTO } from "@/model/userModelDTO";
import { ExpenseDTO } from "@/model/expenseDTO";
import { motion } from "framer-motion";
import { Carousel } from "react-responsive-carousel";
import { Button } from "@/components/ui/button";

import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function Dashboard() {
    const [user, setUser] = useState<UserDTO>();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setUser(data.user);
                    setExpenses(data.user.expenses || []);
                } else {
                    console.error("Échec de récupération des données utilisateur", data);
                    router.push("/login");
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des données utilisateur", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    useEffect(() => {
        if (user && user.money === "0") {
            router.push("/dashboard/budget");
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };
    const handleUpdateBalance = () => {
        router.push("/dashboard/budget");
    };

    const handleCreateExpense = () => {
        router.push("/dashboard/depenses");
    };

    const handleModifyExpense = (expenseId: string) => {
        router.push(`/dashboard/depenses/${expenseId}`);
    };

    const handleDeleteExpense = async (expenseId: string) => {
        try {
            const response = await fetch(`/api/auth/depenses/${expenseId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.ok) {
                setExpenses(expenses.filter(expense => expense.id !== expenseId));
            } else {
                console.error("Erreur lors de la suppression de la dépense");
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de la dépense", error);
        }
    };

    const getBalanceColor = (balance: string) => {
        const amount = parseFloat(balance);
        return amount < 50 ? "text-red-600" : "text-green-500";
    };

    if (loading) return <div className="text-center mt-10 text-gray-800">Chargement...</div>;

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-gray-900 to-gray-700 p-6 sm:p-8 md:p-12 transition-all">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl font-extrabold text-center text-white mb-6 sm:text-6xl">
                Bienvenue, {user.nom} {user.prenom} !
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-opacity-75 bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-2xl text-gray-800 mb-8 text-center">

                <p className="text-white text-xl font-semibold mb-4">Votre solde actuel :</p>
                <p className={`text-3xl font-bold ${getBalanceColor(user.money)} mb-6`}>{user.money} €</p>
                <Button
                    onClick={handleUpdateBalance}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition ease-in-out duration-300 transform hover:scale-105">
                    Mettre à jour le solde
                </Button>
            </motion.div>

            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                onClick={handleCreateExpense}
                className="py-3 px-6 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition ease-in-out duration-300 transform hover:scale-105 mb-6">
                Ajouter une dépense
            </motion.button>

            {expenses.length === 0 ? (
                <div className="bg-opacity-75 bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-xl text-gray-800 text-center">
                    <p className="text-white text-xl font-semibold mb-4">Aucune dépense enregistrée.</p>
                </div>
            ) : (
                <Carousel
                    showThumbs={false}
                    showStatus={false}
                    infiniteLoop
                    autoPlay
                    interval={4000}
                    className="w-full max-w-2xl shadow-lg rounded-lg overflow-hidden"
                >
                    {expenses.map((expense, index) => (
                        <div key={expense.id || index} className="p-6 bg-gray-800 text-white rounded-lg relative flex flex-col items-center">
                            <h3 className="text-2xl font-semibold mb-4">{expense.name}</h3>
                            <p className="text-lg">Prix initial : {expense.initialPrice} €</p>
                            <p className="text-lg">Prix actuel : {expense.currentPrice} €</p>
                            <p className="text-lg">
                                Échéance : {new Date(expense.deadline).toLocaleDateString()} {new Date(expense.deadline).toLocaleTimeString()}
                            </p>

                            <div className="mt-4 flex justify-between w-full pt-7 rounded-b-lg">
                                <Button
                                    onClick={() => handleModifyExpense(expense.id)}
                                    className="py-3 px-6 bg-blue-700 text-white rounded-lg hover:bg-blue-900 transition ease-in-out duration-300 transform hover:scale-105 w-5/12">
                                    Modifier
                                </Button>
                                <Button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-800 transition ease-in-out duration-300 transform hover:scale-105 w-5/12">
                                    Supprimer
                                </Button>
                            </div>

                        </div>

                    ))}
                </Carousel>
            )}

            <Button
                onClick={handleLogout}
                className="mt-8 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all ease-in-out duration-300 transform hover:scale-105">
                Se Déconnecter
            </Button>
        </div>
    );
}
