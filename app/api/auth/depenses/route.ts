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

        const { name, initialPrice, days, deadline, renewable } = await request.json();
        const parsedInitialPrice = parseFloat(initialPrice);

        if (!name || isNaN(parsedInitialPrice) || !deadline) {
            return NextResponse.json({ message: "Données incomplètes ou format incorrect" }, { status: 400 });
        }

        const session = driver.session();

        try {
            const result = await session.run(
                `MATCH (u:User {email: $email}) 
                 WITH u, u.money AS oldMoney
                 WHERE oldMoney >= $initialPrice
                 CREATE (e:Expense {name: $name, days: $days, initialPrice: $initialPrice, currentPrice: $initialPrice, deadline: $deadline, renewable: $renewable})
                 MERGE (u)-[:HAS_EXPENSE]->(e)
                 SET u.money = oldMoney - $initialPrice
                 RETURN e, u.money AS newMoney, ID(e) AS expenseId`,
                {
                    email: payload.email,
                    name,
                    days,
                    initialPrice: parsedInitialPrice,
                    deadline,
                    renewable: Boolean(renewable),
                }
            );

            if (result.records.length === 0) {
                return NextResponse.json({ message: "Utilisateur non trouvé ou fonds insuffisants" }, { status: 400 });
            }

            const expense = result.records[0].get("e");
            const newMoney = result.records[0].get("newMoney");
            const expenseId = result.records[0].get("expenseId");

            if (expenseId === undefined) {
                return NextResponse.json({ message: "Erreur lors de la récupération de l'ID de la dépense" }, { status: 500 });
            }

            return NextResponse.json({
                message: "Dépense créée avec succès",
                userMoney: newMoney,
                expense: {
                    id: expenseId.toString(),
                    name: expense.properties.name,
                    initialPrice: expense.properties.initialPrice,
                    currentPrice: expense.properties.currentPrice,
                    deadline: expense.properties.deadline,
                    renewable: expense.properties.renewable,
                },
            }, { status: 201 });

        } catch (error) {
            console.error("Erreur lors de la création de la dépense:", error);
            return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
        } finally {
            await session.close();
        }
    } catch (error) {
        return NextResponse.json({ message: "Token invalide ou expiré --> " + error}, { status: 401 });
    }
}