"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function Register() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<{
        nom: string;
        prenom: string;
        pseudo: string;
        email: string;
        password: string;
    }>({
        nom: "",
        prenom: "",
        pseudo: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    const isValidEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password: string) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;':",.<>?/]).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { nom, prenom, pseudo, email, password } = formData;

        if (!nom || !prenom || !pseudo || !email || !password) {
            setError("Tous les champs sont obligatoires.");
            return;
        }

        if (!isValidEmail(email)) {
            setError("L'email n'est pas valide.");
            return;
        }

        if (!isValidPassword(password)) {
            setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prenom, nom, pseudo, email, password })
            });


            const data = await response.json();

            if (response.ok) {
                const { token } = data;
                localStorage.setItem("token", token);
                router.push("/dashboard");
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error(err);
            setError("Une erreur s'est produite lors de l'inscription.");
        }
        finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 to-gray-700 p-6 sm:p-8 md:p-12">
            <div className="max-w-md w-full text-center">
                <Card className="bg-opacity-80 bg-gray-800 text-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-4xl font-extrabold text-white mb-4">Inscription</h1>
                    <p className="text-xl text-gray-300 mb-6">Créez votre compte SpendApp</p>

                    {error && <div className="text-red-600 mt-2 text-lg">{error}</div>}

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <Input
                            type="text"
                            name="prenom"
                            placeholder="Prénom"
                            value={formData.prenom}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <Input
                            type="text"
                            name="nom"
                            placeholder="Nom"
                            value={formData.nom}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <Input
                            type="text"
                            name="pseudo"
                            placeholder="Pseudo"
                            value={formData.pseudo}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <Input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <Input
                            type="password"
                            name="password"
                            placeholder="Mot de passe"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <Button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition transform hover:scale-105"
                        >
                            {loading ? "Chargement..." : "S'inscrire"}
                        </Button>
                    </form>

                    <div className="mt-4 space-y-2">
                        <Button
                            onClick={() => router.push("/")}
                            className="w-full py-2 text-white bg-black border border-gray-300 rounded-lg hover:bg-gray-700 transition transform hover:scale-105"
                            disabled={loading}
                        >
                            Acceuil
                        </Button>
                        <p
                            onClick={() => router.push("/login")}
                            className="w-full py-2 text-blue-600 hover:underline transition transform hover:scale-105"
                        >
                            Vous avez déjà un compte ? Se connecter
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
