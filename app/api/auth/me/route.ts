import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import driver from "@/lib/neo4j";
import { UserDTO } from "@/model/userModelDTO";
import { ExpenseDTO } from "@/model/expenseDTO";
export async function GET(request: Request) {
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ message: "Token manquant" }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));

        if (!payload.email) {
            return NextResponse.json({ message: "Token invalide" }, { status: 401 });
        }

        const session = driver.session();

        try {
            await session.run(
                `MATCH (u:User {email: $email})-[:HAS_EXPENSE]->(e:Expense) 
                 WHERE e.renewable = true AND date(substring(e.deadline, 0, 10)) < date()
                 SET e.deadline = date(substring(e.deadline, 0, 10)) + duration({ days: e.days })
                 RETURN e`,
                { email: payload.email }
            );

            const result = await session.run(
                `MATCH (u:User {email: $email}) 
                 OPTIONAL MATCH (u)-[:HAS_EXPENSE]->(e:Expense)
                 RETURN u.prenom AS prenom, 
                        u.nom AS nom, 
                        u.email AS email, 
                        u.pseudo AS pseudo,
                        u.money AS money, 
                        [exp IN COLLECT(
                            CASE 
                                WHEN e IS NOT NULL THEN { 
                                    id: ID(e),   // Ajoute l'ID de la dépense
                                    name: e.name, 
                                    initialPrice: e.initialPrice, 
                                    currentPrice: e.currentPrice, 
                                    deadline: e.deadline,
                                    renewable: e.renewable,
                                    days: e.days
                                } 
                                ELSE NULL 
                            END
                        ) WHERE exp IS NOT NULL] AS expenses`,
                { email: payload.email }
            );

            if (result.records.length === 0) {
                return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
            }

            const record = result.records[0];
            const expensesData = record.get("expenses") || [];
            console.log("Expenses with ID:", expensesData);
            const user: UserDTO = {
                prenom: record.get("prenom"),
                nom: record.get("nom"),
                email: record.get("email"),
                pseudo: record.get("pseudo"),
                money: record.get("money"),
                expenses: expensesData.map((expense: ExpenseDTO) => ({
                    id: expense?.id ? expense.id.toString() : "",
                    name: expense?.name ?? "",
                    initialPrice: expense?.initialPrice ?? "",
                    currentPrice: expense?.currentPrice ?? "",
                    deadline: expense?.deadline ?? "",
                    renewable: expense?.renewable ?? false,
                    days: expense?.days ?? 0,
                })),
            };

            console.log("USER:", user);

            return NextResponse.json({ user }, { status: 200 });

        } finally {
            await session.close();
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}