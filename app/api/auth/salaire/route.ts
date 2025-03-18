import { NextResponse } from "next/server";
import driver from "@/lib/neo4j";
import { jwtVerify } from "jose";

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

        const { name, price, duration, deadline, renewable } = await request.json();

        if (!name || isNaN(parseFloat(price)) || !deadline || !["MONTHLY", "WEEKLY"].includes(duration)) {
            return NextResponse.json({ message: "Données incomplètes ou format incorrect" }, { status: 400 });
        }

        const session = driver.session();

        try {
            const result = await session.run(
                `MATCH (u:User {email: $email})
                 WITH u, u.money AS oldMoney
                 CREATE (s:Salary {name: $name, duration: $duration, price: $price, renewable: $renewable, deadline: $deadline})
                 MERGE (u)-[:HAS_SALARY]->(s)
                 SET u.money = oldMoney + $price
                 RETURN s, u.money AS newMoney, ID(s) AS salaryId`,
                {
                    email: payload.email,
                    name,
                    duration,
                    price: parseFloat(price),
                    deadline,
                    renewable: Boolean(renewable),
                }
            );

            if (result.records.length === 0) {
                return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 400 });
            }

            const salary = result.records[0].get("s");
            const newMoney = result.records[0].get("newMoney");
            const salaryId = result.records[0].get("salaryId");

            if (salaryId === undefined) {
                return NextResponse.json({ message: "Erreur lors de la récupération de l'ID du salaire" }, { status: 500 });
            }

            return NextResponse.json({
                message: "Salaire créé avec succès",
                userMoney: newMoney,
                salary: {
                    id: salaryId.toString(),
                    name: salary.properties.name,
                    duration: salary.properties.duration,
                    price: salary.properties.price,
                    renewable: salary.properties.renewable,
                    deadline: salary.properties.deadline,
                },
            }, { status: 201 });

        } catch (error) {
            console.error("Erreur lors de la création du salaire:", error);
            return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
        } finally {
            await session.close();
        }
    } catch (error) {
        return NextResponse.json({ message: "Token invalide ou expiré --> " + error }, { status: 401 });
    }
}