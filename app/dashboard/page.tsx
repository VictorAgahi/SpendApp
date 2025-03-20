"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {AnimatePresence, motion} from "framer-motion";
import {Carousel} from "react-responsive-carousel";
import {Button} from "@/components/ui/button";
import {ArrowDown, ArrowUp, ChevronDown, Clock, History, Wallet} from "lucide-react";
import {UserDTO} from "@/model/userModelDTO";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import {ExpenseDTO} from "@/model/expenseDTO";
import {SalaireDTO, TYPE} from "@/model/SalaireDTO";
import {TransfertDTO} from "@/model/TransfertDTO";
import {IncomeDTO} from "@/model/IncomeDTO";


const HistoryItem = ({ item, type }: { item: TransfertDTO | IncomeDTO; type: string }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-lg mb-3 flex items-center justify-between bg-gray-800"
    >
        <div className="flex items-center gap-2 flex-1">
            <div className={`p-2 rounded-full ${type === 'sent' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                {type === 'sent' ? <ArrowUp className="text-red-500" /> : <ArrowDown className="text-green-500" />}
            </div>
            <div>
                <h4 className="font-semibold text-white">{item.name}</h4>
                <p className="text-sm text-gray-400">{new Date(item.date).toLocaleDateString() + "\n" + new Date(item.date).toLocaleTimeString()}</p>
            </div>
        </div>
        <span
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap min-w-[80px] text-center flex justify-center ${
                type === 'sent' ? 'text-red-400 bg-red-500/20' : 'text-green-400 bg-green-500/20'
            }`}
        >
            {type === 'sent' ? '-' : '+'}{item.price} €
        </span>
    </motion.div>
);

export default function Dashboard() {
    const [user, setUser] = useState<UserDTO>();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
    const [salaires, setSalaire] = useState<SalaireDTO[]>([]);
    const [transferts, setTransfert] = useState<TransfertDTO[]>([]);
    const [incomes, setIncome] = useState<IncomeDTO[]>([]);
    const router = useRouter();

    const getUpcomingTransfers = () => {
        return salaires
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setUser(data.user);
                    setExpenses(data.user.expenses || []);
                    setSalaire(data.user.salaries || []);
                    setIncome(data.user.incomes || []);
                    setTransfert(data.user.transferts || []);
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
        setLoading(true);
        console.log("EXPENSE" + expenseId);
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
        } finally {
            setLoading(false);
        }
    };

    const getBalanceColor = (balance: string) => {
        const amount = parseFloat(balance);
        return amount < 50 ? "text-red-600" : "text-green-500";
    };

    const [historyType, setHistoryType] = useState<'all' | 'sent' | 'received'>('all');
    const combinedHistory = [
        ...transferts.map(t => ({...t, type: 'sent' as const})),
        ...incomes.map(i => ({...i, type: 'received' as const}))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredHistory = combinedHistory.filter(item =>
        historyType === 'all' ? true : item.type === historyType
    );

    if (loading) return <div className="text-center mt-10 text-white">Chargement...</div>;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-8 sm:p-20">
            <div className="max-w-6xl mx-auto">
                <motion.h1
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    className="text-3xl sm:text-5xl font-bold text-white mb-8"
                >
                    Bonjour, {user.prenom} 👋
                </motion.h1>

                {/* Carte de solde */}
                <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl p-6 mb-8 shadow-xl"
                    initial={{scale: 0.95}}
                    animate={{scale: 1}}
                >
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="opacity-80">Solde actuel</p>
                            <p className={`text-3xl font-bold ${getBalanceColor(user.money)} mb-6`}>{user.money} €</p>
                        </div>
                        <Wallet className="w-12 h-12"/>
                    </div>
                    <Button
                        onClick={handleUpdateBalance}
                        className="mt-4 w-full bg-white/20 hover:bg-white/30"
                    >
                        Mettre à jour
                    </Button>
                </motion.div>

                {expenses.length === 0 ? (
                    <div className="bg-opacity-75 bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-xl text-gray-800 text-center">
                        <p className="text-white text-xl font-semibold mb-4">Aucune dépense enregistrée.</p>
                        <motion.button
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{duration: 0.4}}
                            onClick={handleCreateExpense}
                            className="py-3 px-6 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition ease-in-out duration-300 transform hover:scale-105 mb-6">
                            Ajouter une dépense
                        </motion.button>
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
                            <div key={expense.id || index}
                                 className="p-4 bg-gray-800 text-white rounded-lg relative flex flex-col items-center">
                                <h3 className="text-2xl font-semibold mb-4">{expense.name}</h3>
                                <p className="text-lg">Prix initial : {expense.initialPrice} €</p>
                                <p className="text-lg">Prix actuel : {expense.currentPrice} €</p>
                                <p className="text-lg">
                                    Échéance
                                    : {new Date(expense.deadline).toLocaleDateString()} {new Date(expense.deadline).toLocaleTimeString()}
                                </p>

                                <div className="mt-4 flex justify-between w-full pt-3 rounded-b-lg">
                                    <Button
                                        disabled={loading}
                                        onClick={() => handleModifyExpense(expense.id)}
                                        className="py-3 px-6 bg-blue-700 text-white rounded-lg hover:bg-blue-900 transition ease-in-out duration-300 transform hover:scale-105 w-5/12">
                                        Modifier
                                    </Button>
                                    <Button
                                        disabled={loading}
                                        onClick={() => handleDeleteExpense(expense.id)}
                                        className="py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-800 transition ease-in-out duration-300 transform hover:scale-105 w-5/12">
                                        Supprimer
                                    </Button>
                                </div>

                            </div>

                        ))}
                    </Carousel>
                )}
                <section className="mb-8 mt-8">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="text-blue-400"/> Prochains arrivages
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        {getUpcomingTransfers().map((salaire, index) => (
                            <motion.div
                                key={index}
                                className="bg-gray-800 p-4 rounded-xl"
                                initial={{opacity: 0, x: -20}}
                                animate={{opacity: 1, x: 0}}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-white">{salaire.name}</h3>
                                        <p className="text-sm text-gray-400">
                                            {(new Date(salaire.date).toLocaleDateString())}
                                        </p>
                                    </div>
                                    <span className="bg-green-500/20 px-3 py-1 rounded-full text-sm text-green-400">
                    +{salaire.price} €
                  </span>
                                </div>
                                {salaire.renewable ?
                                <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
                                    <span className="bg-blue-500/20 px-2 py-1 rounded">Récurrent</span>
                                    <span>{salaire.duration == TYPE.WEEKLY ? "Toutes les semaines " : "Tout les mois"}</span>
                                </div> :
                                    <div className="mt-3 flex items-center gap-2 text-sm text-white">
                                        <span className="bg-red-600/20 px-2 py-1 rounded">Non Récurrent </span>
                                    </div>
                                }
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <History className="text-purple-400"/> Historique des transactions
                        </h2>
                        <div className="relative">
                            <select
                                value={historyType}
                                onChange={(e) => setHistoryType(e.target.value as 'all' | 'sent' | 'received')}
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg appearance-none"
                            >
                                <option value="all">Toutes</option>
                                <option value="sent">Envoyées</option>
                                <option value="received">Reçues</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16}/>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredHistory.map((item, index) => (
                                <HistoryItem key={index} item={item} type={item.type}/>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </div>
    );
}