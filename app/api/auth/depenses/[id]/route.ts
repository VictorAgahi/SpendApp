import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import driver from "@/lib/neo4j";

// Fonction de vérification du token et extraction de l'email
async function verifyTokenAndGetEmail(request: Request): Promise<string> {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
        throw new Error("Token manquant");
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        if (!payload || typeof payload.email !== "string") throw new Error("Token invalide ou email manquant");
        return payload.email;
    } catch (error) {
        throw new Error("Erreur de validation du token: " + (error as Error).message);
    }
}

// Fonction pour récupérer une dépense par son ID
async function getExpenseById(email: string, id: number) {
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (u:User {email: $email})-[:HAS_EXPENSE]->(e:Expense) 
             WHERE ID(e) = $id RETURN e`,
            { email, id }
        );
        return result.records.length > 0 ? result.records[0].get("e").properties : null;
    } finally {
        await session.close();
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const email = await verifyTokenAndGetEmail(request);
        const newId = parseInt(id);
        if (isNaN(newId)) return NextResponse.json({ message: "ID invalide" }, { status: 400 });

        const expense = await getExpenseById(email, newId);
        if (!expense) return NextResponse.json({ message: "Dépense non trouvée ou non autorisée" }, { status: 403 });

        return NextResponse.json(expense, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const email = await verifyTokenAndGetEmail(request);
        const newId = parseInt(id);
        if (isNaN(newId)) return NextResponse.json({ message: "ID invalide" }, { status: 400 });

        const expense = await getExpenseById(email, newId);
        if (!expense) return NextResponse.json({ message: "Dépense non trouvée ou non autorisée" }, { status: 403 });

        const data = await request.json();
        const session = driver.session();
        await session.run(
            `MATCH (e:Expense) WHERE ID(e) = $id 
             SET e.name = $name, e.currentPrice = $currentPrice, e.deadline = $deadline`,
            { id: newId, ...data }
        );
        await session.close();

        return NextResponse.json({ message: "Dépense mise à jour avec succès" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {

        const id = (await params).id;
        console.log(id.toString());
        const email = await verifyTokenAndGetEmail(request);
        const newId = parseInt(id);
        if (isNaN(newId)) return NextResponse.json({ message: "ID invalide" }, { status: 400 });

        const expense = await getExpenseById(email, newId);
        if (!expense) return NextResponse.json({ message: "Dépense non trouvée ou non autorisée" }, { status: 403 });

        const session = driver.session();
        await session.run(
            `MATCH (u:User {email: $email})-[r:HAS_EXPENSE]->(e:Expense) 
             WHERE ID(e) = $id 
             DETACH DELETE e`,
            { email, id: newId }
        );
        await session.close();

        return NextResponse.json({ message: "Dépense et relation supprimées avec succès" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}