import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "https://lldev.thespacedevs.com/2.3.0/launches/"
      : "https://ll.thespacedevs.com/2.3.0/launches/";

  try {
    const res = await fetch(
      `${baseUrl}${encodeURIComponent(id)}/?format=json`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Launch not found or API unavailable" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch launch detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch launch detail" },
      { status: 500 }
    );
  }
}
