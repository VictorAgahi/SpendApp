"use client";

import { useRouter } from "next/navigation";
import { Button} from "@/components/ui/button"
import { Card } from "@/components/ui/card";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 to-gray-700 p-6 sm:p-8 md:p-12">
        <div className="max-w-lg w-full text-center">
          <Card className="bg-opacity-80 bg-gray-800 text-white p-8 rounded-lg shadow-lg">
            <h1 className="text-4xl font-extrabold text-white mb-4">Bienvenue sur SpendApp</h1>
            <p className="text-xl text-gray-300 mb-6">
              Gérez vos dépenses facilement en créant des budgets et en suivant vos transactions.
            </p>

            <div className="mt-6 space-y-4">
              <Button
                  onClick={handleLogin}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition transform hover:scale-105"
              >
                Se connecter
              </Button>
              <Button
                  onClick={handleRegister}
                  className="text-white w-full py-3 border bg-black border-gray-300  font-semibold rounded-lg shadow-md hover:bg-gray-700 transition transform hover:scale-105"
              >
                S&#39;inscrire
              </Button>
            </div>
          </Card>
        </div>
      </div>
  );
}
