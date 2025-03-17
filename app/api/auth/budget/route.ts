import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import driver from "@/lib/neo4j";

export async function POST(request: Request) {
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Token manquant" }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        if (!payload.email) {
            return NextResponse.json({ message: "Token invalide" }, { status: 401 });
        }

        const { parsedAmount } = await request.json();
        const session = driver.session();

        try {
            const result = await session.run(
                `MATCH (u:User {email: $email})
                 SET u.money = $money
                 RETURN u`,
                { email: payload.email, money: parsedAmount }
            );
            if (result.records.length > 0) {
                return NextResponse.json({ message: "Montant mis à jour avec succès" }, { status: 200 });
            } else {
                return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour du montant", error);
            return NextResponse.json({ message: "Erreur lors de la mise à jour du montant" }, { status: 500 });
        } finally {
            await session.close();
        }
    } catch (error) {
        console.error("Erreur lors de la vérification du token ou de la récupération des données:", error);
        return NextResponse.json({ message: "Token invalide ou expiré" }, { status: 401 });
    }
}