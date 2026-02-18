import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
    return NextResponse.json(
        {
            status: "ok",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "0.1.0",
            uptime: process.uptime(),
        },
        {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
        }
    );
}
