import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("Le secret JWT est manquant");
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

        await jwtVerify(token, secret);

        return NextResponse.next();
    } catch (error) {
        console.error(error);
        return NextResponse.redirect(new URL("/", req.url));
    }
}

export const config = {
    matcher: ["/dashboard", "/dashboard/:path*"],
};