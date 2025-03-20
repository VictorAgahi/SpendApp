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

        const { name, price, type, date, duration, renewable } = await request.json();

        if (!name || isNaN(parseFloat(price)) || !["TRANSFER", "SALARY", "INCOME"].includes(type) || !["MONTHLY", "WEEKLY", "NONE"].includes(duration)) {
            return NextResponse.json({ message: "Données incomplètes ou format incorrect" }, { status: 400 });
        }

        const session = driver.session();

        try {
            let link = "";

            if (type === "SALARY") {
                const result = await session.run(
                    `MATCH (u:User {email: $email})
                     CREATE (s:Salary {name: $name, duration: $duration, price: $price, renewable: $renewable, date: $date})
                     MERGE (u)-[:HAS_SALARY]->(s)
                     RETURN s, ID(s) AS salaryId`,
                    {
                        email: payload.email,
                        name,
                        duration,
                        price: parseFloat(price),
                        renewable: Boolean(renewable),
                        date: date,
                    }
                );

                if (result.records.length === 0) {
                    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 400 });
                }

                const salary = result.records[0].get("s");
                const salaryId = result.records[0].get("salaryId");

                if (salaryId === undefined) {
                    return NextResponse.json({ message: "Erreur lors de la récupération de l'ID du salaire" }, { status: 500 });
                }

                link = `/salaire/${salaryId.toString()}`;

                return NextResponse.json({
                    message: "Salaire créé avec succès",
                    salary: {
                        id: salaryId.toString(),
                        name: salary.properties.name,
                        duration: salary.properties.duration,
                        price: salary.properties.price,
                        renewable: salary.properties.renewable,
                        link,
                    },
                }, { status: 201 });
            }
            else if (type === "TRANSFER") {
                const result = await session.run(
                    `MATCH (u:User {email: $email})
                     WITH u, u.money AS oldMoney
                     CREATE (t:Transfer {name: $name, price: $price, date: $date})
                     MERGE (u)-[:HAS_TRANSFER]->(t)
                     SET u.money = oldMoney - $price
                     RETURN t, u.money AS newMoney, ID(t) AS transferId`,
                    {
                        email: payload.email,
                        name,
                        date: new Date().toISOString(),
                        price: parseFloat(price),
                    }
                );

                if (result.records.length === 0) {
                    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 400 });
                }

                const transfer = result.records[0].get("t");
                const newMoney = result.records[0].get("newMoney");
                const transferId = result.records[0].get("transferId");

                if (transferId === undefined) {
                    return NextResponse.json({ message: "Erreur lors de la récupération de l'ID du virement" }, { status: 500 });
                }

                link = `/virement/${transferId.toString()}`; // Lien du virement

                return NextResponse.json({
                    message: "Virement créé avec succès",
                    userMoney: newMoney,
                    transfer: {
                        id: transferId.toString(),
                        name: transfer.properties.name,
                        price: transfer.properties.price,
                        link,
                    },
                }, { status: 201 });
            }
            else if (type === "INCOME") {
                const result = await session.run(
                    `MATCH (u:User {email: $email})
                     WITH u, u.money AS oldMoney
                     CREATE (i:Income {name: $name, price: $price, date: $date})
                     MERGE (u)-[:HAS_INCOME]->(i)
                     SET u.money = oldMoney + $price
                     RETURN i, u.money AS newMoney, ID(i) AS incomeId`,
                    {
                        email: payload.email,
                        name,
                        price: parseFloat(price),
                        date: new Date().toISOString(),
                    }
                );

                if (result.records.length === 0) {
                    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 400 });
                }

                const income = result.records[0].get("i");
                const newMoney = result.records[0].get("newMoney");
                const incomeId = result.records[0].get("incomeId");

                if (incomeId === undefined) {
                    return NextResponse.json({ message: "Erreur lors de la récupération de l'ID du virement" }, { status: 500 });
                }

                link = `/virement/${incomeId.toString()}`; // Lien du virement

                return NextResponse.json({
                    message: "Virement créé avec succès",
                    userMoney: newMoney,
                    transfer: {
                        id: incomeId.toString(),
                        name: income.properties.name,
                        price: income.properties.price,
                        link,
                    },
                }, { status: 201 });
            }
            else {
                return NextResponse.json({ message: "Type de paiement inconnu" }, { status: 400 });
            }
        } catch (error) {
            console.error("Erreur lors de la création du paiement:", error);
            return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
        } finally {
            await session.close();
        }
    } catch (error) {
        return NextResponse.json({ message: "Token invalide ou expiré --> " + error }, { status: 401 });
    }
}
