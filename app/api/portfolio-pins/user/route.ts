import { NextResponse } from "next/server";
import {
  isGoogleSheetsConfigured,
  readPortfolioPinHashesFromSheets,
  savePortfolioPinHashToSheets,
} from "@/lib/google-sheets";
import {
  hashPortfolioPinServer,
  validatePortfolioPinHash,
} from "@/lib/portfolio-pin-server";
import { normalizePinInput } from "@/lib/portfolio-pin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    portfolioId?: string;
    currentPin?: unknown;
    newPin?: unknown;
  };
  const portfolioId = String(body.portfolioId ?? "").trim();
  const currentPin = normalizePinInput(body.currentPin);
  const newPin = normalizePinInput(body.newPin);

  if (!portfolioId) {
    return NextResponse.json({ error: "Portfolio ID is required." }, { status: 400 });
  }

  if (!/^\d{4}$/u.test(currentPin) || !/^\d{4}$/u.test(newPin)) {
    return NextResponse.json(
      { error: "Current PIN and new PIN must be 4 digits." },
      { status: 400 },
    );
  }

  if (!isGoogleSheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets is not configured." },
      { status: 503 },
    );
  }

  const pinHashes = await readPortfolioPinHashesFromSheets();
  const storedHash = pinHashes[portfolioId]?.hash;

  if (!storedHash) {
    return NextResponse.json(
      { error: "Portfolio PIN is not configured." },
      { status: 404 },
    );
  }

  const validation = validatePortfolioPinHash({
    enteredPin: currentPin,
    portfolioId,
    storedHash,
  });

  if (!validation.pinMatch || validation.usedMasterPin) {
    return NextResponse.json(
      { error: "Current portfolio PIN is incorrect." },
      { status: 403 },
    );
  }

  const pinHash = hashPortfolioPinServer(portfolioId, newPin);
  await savePortfolioPinHashToSheets({ portfolioId, pinHash });

  return NextResponse.json({
    ok: true,
    pinHash,
    updatedAt: new Date().toISOString(),
  });
}
