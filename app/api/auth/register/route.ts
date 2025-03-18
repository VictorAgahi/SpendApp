import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import driver from "@/lib/neo4j";
import validator from "validator";
import { serialize } from "cookie";

export async function POST(request: Request) {
    const { email, password, nom, prenom, pseudo } = await request.json();

    if (!email || !password || !nom || !prenom || !pseudo) {
        return NextResponse.json({ message: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    if (!validator.isEmail(email)) {
        return NextResponse.json({ message: "Email invalide" }, { status: 400 });
    }

    if (!validator.isLength(password, { min: 6 })) {
        return NextResponse.json({ message: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    if (!validator.isLength(nom, { min: 2 })) {
        return NextResponse.json({ message: "Le nom doit contenir au moins 2 caractères" }, { status: 400 });
    }

    if (!validator.isLength(prenom, { min: 2 })) {
        return NextResponse.json({ message: "Le prénom doit contenir au moins 2 caractères" }, { status: 400 });
    }

    if (!validator.isLength(pseudo, { min: 2 })) {
        return NextResponse.json({ message: "Le pseudo doit contenir au moins 2 caractères" }, { status: 400 });
    }

    const session = driver.session();

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await session.run(
            'MATCH (u:User {email: $email}) RETURN u',
            { email }
        );

        if (result.records.length > 0) {
            return NextResponse.json({ message: "Utilisateur déjà existant" }, { status: 400 });
        }

        await session.run(
            'CREATE (u:User {email: $email, password: $password, nom: $nom, prenom: $prenom, pseudo: $pseudo, money: $money }) RETURN u',
            { email, password: hashedPassword, nom, prenom, pseudo, money: 0 }
        );

        const token = jwt.sign(
            { email, nom, prenom, pseudo },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d", algorithm: "HS256" }
        );

        const cookie = serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600,
            path: "/",
        });

        const response = NextResponse.json({ message: "Utilisateur créé avec succès", token }, { status: 201 });
        response.headers.set("Set-Cookie", cookie);

        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Erreur lors de l'inscription" }, { status: 500 });
    } finally {
        await session.close();
    }
}