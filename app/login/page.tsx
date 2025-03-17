"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const onSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Tous les champs sont obligatoires.");
            return;
        }

        if (!validateEmail(email)) {
            setError("L'email n'est pas valide.");
            return;
        }

        handleSubmit();
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                const { token } = data;
                localStorage.setItem("token", token); // Store the token in localStorage
                router.push("/dashboard"); // Redirect to dashboard after successful login
            } else {
                setError(data.message || "Une erreur s'est produite lors de la connexion.");
            }
        } catch (err) {
            console.error(err);
            setError("Une erreur s'est produite lors de la connexion.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 to-gray-700 p-6 sm:p-8 md:p-12">
            <div className="max-w-md w-full text-center">
                <Card className="bg-opacity-80 bg-gray-800 text-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-4xl font-extrabold text-white mb-4">Connexion</h1>
                    <p className="text-xl text-gray-300 mb-6">Accédez à votre compte SpendApp</p>

                    {error && <div className="text-red-600 mt-2 text-lg">{error}</div>}

                    <form className="mt-6 space-y-4" onSubmit={onSubmitForm}>
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <Input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <Button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition transform hover:scale-105"
                        >
                            Se connecter
                        </Button>
                    </form>

                    <div className="mt-4 space-y-2">
                        <Button
                            onClick={() => router.push("/")}
                            className="w-full py-2 text-white border bg-black border-gray-300 rounded-lg hover:bg-gray-700 transition transform hover:scale-105"
                        >
                            Accueil
                        </Button>
                        <p
                            onClick={() => router.push("/register")}
                            className="w-full py-2 text-blue-600 hover:underline transition transform hover:scale-105 "
                        >
                            Vous n&#39;avez pas de compte ? S&#39;inscrire
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
