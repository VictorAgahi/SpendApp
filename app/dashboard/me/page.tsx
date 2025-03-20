"use client"
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

export default function ME() {
    const router = useRouter();
    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen  text-center p-4">
            <h1 className="text-6xl font-bold text-white mb-4">EXIT PAGE</h1>
            <p className="text-xl text-white mb-6">Vous pouvez vous deconnecter ici</p>
            <Button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all ease-in-out duration-300 transform hover:scale-105">
                LOGOUT
            </Button>
        </div>
    );
}
