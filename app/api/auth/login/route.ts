import { NextResponse } from "next/server";
import driver from "@/lib/neo4j";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ message: "Email et mot de passe requis" }, { status: 400 });
    }

    const session = driver.session();

    try {
        const result = await session.run(
            'MATCH (u:User {email: $email}) RETURN u',
            { email }
        );

        if (result.records.length === 0) {
            return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
        }

        const user = result.records[0].get("u").properties;
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ message: "Mot de passe incorrect" }, { status: 401 });
        }

        const token = jwt.sign({ email, nom: user.nom, prenom: user.prenom, pseudo: user.pseudo }, process.env.JWT_SECRET as string, {
            expiresIn: "7d",
            algorithm: "HS256",
        });

        const cookie = serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600,
            path: "/",
        });

        const response = NextResponse.json({ message: "Connexion réussie", token }, { status: 200 });
        response.headers.set("Set-Cookie", cookie);
        return response;

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Erreur lors de la connexion" }, { status: 500 });
    } finally {
        await session.close();
    }
}