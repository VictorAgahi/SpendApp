import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import driver from "@/lib/neo4j";
import { UserDTO } from "@/model/userModelDTO";
import {IncomeDTO} from "@/model/IncomeDTO";
import {SalaireDTO, TYPE} from "@/model/SalaireDTO";
import {TransfertDTO} from "@/model/TransfertDTO";

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
            const result = await session.run(
                `MATCH (u:User {email: $email})-[:HAS_EXPENSE]->(e:Expense) 
                 WHERE e.renewable = true AND date(substring(e.deadline, 0, 10)) < date()
                 RETURN e, u.money AS money`,
                { email: payload.email }
            );
            let updatedMoney = 0;
            const updatedExpenses = [];

            for (const record of result.records) {
                console.log(1);
                const expense = record.get("e");
                const userMoney = record.get("money");

                const deadline = new Date(expense.properties.deadline);
                const days = expense.properties.days;
                const now = new Date();

                const renewCount = Math.floor((now.getTime() - deadline.getTime()) / (days * 24 * 60 * 60 * 1000)) + 1;
                console.log(renewCount);
                if (renewCount > 0) {
                    const newDeadline = new Date(deadline);
                    newDeadline.setDate(deadline.getDate() + (renewCount) * days);

                    const newCurrentPrice = expense.properties.currentPrice + renewCount * expense.properties.initialPrice;
                    updatedMoney = userMoney - (renewCount * expense.properties.initialPrice);
                    console.log(updatedMoney);
                    console.log(newCurrentPrice);

                    await session.run(
                        `MATCH (u:User {email: $email})-[:HAS_EXPENSE]->(e:Expense) 
                         WHERE ID(e) = $expenseId 
                         SET e.deadline = $newDeadline, e.currentPrice = $newCurrentPrice`,
                        {
                            email: payload.email,
                            expenseId: expense.identity,
                            newDeadline: newDeadline.toISOString().split("T")[0],
                            newCurrentPrice: newCurrentPrice
                        }
                    );

                    updatedExpenses.push({
                        id: expense.identity.toString(),
                        name: expense.properties.name,
                        initialPrice: expense.properties.initialPrice,
                        currentPrice: newCurrentPrice,
                        deadline: newDeadline.toISOString().split("T")[0],
                        renewable: true,
                        days: days
                    });
                    console.log(updatedExpenses);
                }
            }
            await session.run(
                `MATCH (u:User {email: $email})-[:HAS_EXPENSE]->(e:Expense) 
                 WHERE e.renewable = false AND date(substring(e.deadline, 0, 10)) < date()
                 WITH u, collect(e) AS expenses, sum(e.currentPrice) AS totalRefund
                 SET u.money = u.money + totalRefund
                 FOREACH (expense IN expenses | DETACH DELETE expense)`,
                { email: payload.email }
            );


            if (updatedMoney !== 0) {
                await session.run(
                    `MATCH (u:User {email: $email}) 
                     SET u.money = $updatedMoney`,
                    {
                        email: payload.email,
                        updatedMoney: updatedMoney
                    }
                );
            }

            if (updatedExpenses.length === 0) {

                const expensesResult = await session.run(
                    `MATCH (u:User {email: $email})-[:HAS_EXPENSE]->(e:Expense)
                     RETURN ID(e) AS id, e.name AS name, e.initialPrice AS initialPrice, 
                            e.currentPrice AS currentPrice, e.deadline AS deadline, 
                            e.renewable AS renewable, e.days AS days`,
                    { email: payload.email }
                );
                updatedExpenses.push(...expensesResult.records.map(record => ({
                    id: record.get("id").toString(),
                    name: record.get("name"),
                    initialPrice: record.get("initialPrice"),
                    currentPrice: record.get("currentPrice"),
                    deadline: record.get("deadline"),
                    renewable: record.get("renewable"),
                    days: record.get("days")
                })));
            }


            const incomeDTO: IncomeDTO[] = [];
            const incomeResult = await session.run(
                `MATCH (u:User {email: $email})-[:HAS_INCOME]->(i:Income) 
     RETURN ID(i) as id, i.name as name , i.price as price , i.date as date`,
                { email: payload.email }
            );

            incomeDTO.push(...incomeResult.records.map(record => ({
                id: record.get("id").toString(),
                name: record.get("name"),
                price: record.get("price"),
                date: new Date(record.get("date"))
            })));

            const transfertDTO: TransfertDTO[] = [];
            const transfertResult = await session.run(
                `MATCH (u:User {email: $email})-[:HAS_TRANSFER]->(t:Transfer) 
                RETURN ID(t) as id, t.name as name , t.price as price , t.date as date`,
                { email: payload.email }
            );

            transfertDTO.push(...transfertResult.records.map(record => ({
                id: record.get("id").toString(),
                name: record.get("name"),
                price: record.get("price"),
                date: new Date(record.get("date"))
            })));

            let salaireDTO: SalaireDTO[] = [];
            let salaireResult = await session.run(
                `MATCH (u:User {email: $email})-[:HAS_SALARY]->(t:Salary)
     RETURN ID(t) as id, t.name as name, t.duration as duration, 
            t.price as price, t.date as date, t.renewable as renewable`,
                { email: payload.email }
            );

            let salaires = salaireResult.records.map(record => ({
                id: record.get('id').toNumber(),
                name: record.get('name'),
                duration: record.get('duration') === "WEEKLY" ? TYPE.WEEKLY : TYPE.MONTHLY,
                price: parseFloat(record.get('price')),
                date: new Date(record.get('date')),
                renewable: record.get('renewable'),
            }));

            salaireDTO.push(...salaires);
            const currentDate = new Date();
            for (const salaire of salaires) {
                while (salaire.date <= currentDate)
                {
                    await session.run(
                            `MATCH (u:User {email: $email}) 
                 SET u.money = u.money + $price`,
                            { email: payload.email, price: salaire.price }
                        );


                    if (salaire.renewable)
                    {
                        if (salaire.duration === TYPE.MONTHLY) {
                            salaire.date.setMonth(salaire.date.getMonth() + 1);
                        }
                        else
                        {
                            salaire.date.setDate(salaire.date.getDate() + 7);
                        }

                        await session.run(
                                `MATCH (t:Salary) 
                     WHERE ID(t) = $id 
                     SET t.date = $newDate`,
                                { id: salaire.id, newDate: salaire.date.getTime() }
                            )

                    }
                    else {
                        await session.run(
                                `MATCH (t:Salary) 
                     WHERE ID(t) = $id 
                     DETACH DELETE t`,
                                { id: salaire.id }

                        );
                        break;
                    }
                }
            }
             salaireDTO = [];
             salaireResult = await session.run(
                `MATCH (u:User {email: $email})-[:HAS_SALARY]->(t:Salary)
     RETURN ID(t) as id, t.name as name, t.duration as duration, 
            t.price as price, t.date as date, t.renewable as renewable`,
                { email: payload.email }
            );

             salaires = salaireResult.records.map(record => ({
                id: record.get('id').toNumber(),
                name: record.get('name'),
                duration: record.get('duration') === "WEEKLY" ? TYPE.WEEKLY : TYPE.MONTHLY,
                price: parseFloat(record.get('price')),
                date: new Date(record.get('date')),
                renewable: record.get('renewable'),
            }));

            salaireDTO.push(...salaires);
            const userResult = await session.run(
                `MATCH (u:User {email: $email}) 
                 RETURN u.prenom AS prenom, 
                        u.nom AS nom, 
                        u.email AS email, 
                        u.pseudo AS pseudo,
                        u.money AS money`,
                { email: payload.email }
            );

            if (userResult.records.length === 0) {
                return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
            }

            const record = userResult.records[0];
            const user: UserDTO = {
                prenom: record.get("prenom"),
                nom: record.get("nom"),
                email: record.get("email"),
                pseudo: record.get("pseudo"),
                money: record.get("money"),
                expenses: updatedExpenses,
                incomes : incomeDTO,
                transferts: transfertDTO,
                salaries: salaireDTO,
            };


            return NextResponse.json({ user }, { status: 200 });

        } finally {
            await session.close();
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}
