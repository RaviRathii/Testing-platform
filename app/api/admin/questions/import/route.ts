import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const difficultyValues = new Set(["EASY", "MEDIUM", "HARD"]);

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      currentValue = "";

      const trimmedRow = currentRow.map((cell) => cell.trim());
      if (trimmedRow.some((cell) => cell.length > 0)) {
        rows.push(trimmedRow);
      }
      currentRow = [];
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    const trimmedRow = currentRow.map((cell) => cell.trim());
    if (trimmedRow.some((cell) => cell.length > 0)) {
      rows.push(trimmedRow);
    }
  }

  return rows;
}

// Accepts a letter ("C", "Option C", "(c)"), a 1-based number ("3"), or the answer text itself ("Mars").
// Returns null when the value can't be resolved, so the row is skipped instead of silently defaulting to A.
function parseCorrectOption(value: string, options: string[]): number | null {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const letterMatch = normalized.match(/^(?:option\s*)?\(?([a-d])\)?\.?$/);
  if (letterMatch) {
    return letterMatch[1].charCodeAt(0) - "a".charCodeAt(0);
  }

  const numberMatch = normalized.match(/^(?:option\s*)?([1-4])$/);
  if (numberMatch) {
    return Number(numberMatch[1]) - 1;
  }

  const textMatch = options.findIndex((option) => option.trim().toLowerCase() === normalized);
  return textMatch >= 0 ? textMatch : null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const categoryFallback = String(formData.get("category") ?? "General").trim();
    const difficultyFallback = String(formData.get("difficulty") ?? "MEDIUM").trim().toUpperCase();
    const testTitle = String(formData.get("title") ?? "").trim();
    const examName = String(formData.get("examName") ?? "General").trim();
    const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
    const isPublished = String(formData.get("isPublished") ?? "false").toLowerCase() === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A CSV file is required." }, { status: 400 });
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "The uploaded CSV file is empty." }, { status: 400 });
    }

    const rows = parseCsvRows(text);
    if (rows.length < 2) {
      return NextResponse.json({ error: "The CSV file must include a header row and at least one question row." }, { status: 400 });
    }

    const headers = rows[0].map((header) => normalizeHeader(header));
    const requiredHeaders = ["questiontext", "optiona", "optionb", "optionc", "optiond", "correctoption"];

    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `CSV headers are missing required fields: ${missingHeaders.join(", ")}.` },
        { status: 400 },
      );
    }

    const questionIds: string[] = [];
    const skippedRows: number[] = [];
    const admin = await requireAdmin();

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const currentRow = rows[rowIndex];
      const record: Record<string, string> = {};

      headers.forEach((header, index) => {
        record[header] = currentRow[index] ?? "";
      });

      const questionText = (record.questiontext ?? "").trim();
      const optionA = (record.optiona ?? "").trim();
      const optionB = (record.optionb ?? "").trim();
      const optionC = (record.optionc ?? "").trim();
      const optionD = (record.optiond ?? "").trim();

      if (!questionText || !optionA || !optionB || !optionC || !optionD) {
        continue;
      }

      const questionCategory = ((record.category ?? categoryFallback) || "General").trim();
      const rawDifficulty = (record.difficulty ?? difficultyFallback).trim().toUpperCase();
      const normalizedDifficulty = difficultyValues.has(rawDifficulty) ? rawDifficulty : "MEDIUM";
      const explanation = (record.explanation ?? "").trim();
      const correctOption = parseCorrectOption(record.correctoption ?? record.correctanswer ?? "", [
        optionA,
        optionB,
        optionC,
        optionD,
      ]);

      if (correctOption === null) {
        // Row numbers are 1-based and include the header row, matching what a spreadsheet shows.
        skippedRows.push(rowIndex + 1);
        continue;
      }

      const question = await prisma.question.create({
        data: {
          category: questionCategory,
          difficulty: normalizedDifficulty as "EASY" | "MEDIUM" | "HARD",
          questionText,
          options: [optionA, optionB, optionC, optionD],
          correctOption,
          explanation,
          isActive: true,
          createdById: admin.id,
        },
      });

      questionIds.push(question.id);
    }

    if (questionIds.length === 0) {
      return NextResponse.json(
        {
          error: skippedRows.length
            ? `No questions imported: the correct option could not be read on rows ${skippedRows.join(", ")}. Use A–D, 1–4, or the exact answer text.`
            : "No valid questions were found in the uploaded CSV file.",
          skippedRows,
        },
        { status: 400 },
      );
    }

    let createdTest: { id: string; title: string; questionCount: number } | null = null;

    if (testTitle) {
      const createdMockTest = await prisma.mockTest.create({
        data: {
          title: testTitle,
          examName: examName || "General",
          description: `Created from uploaded CSV import on ${new Date().toISOString()}`,
          durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 60,
          isPublished,
          createdById: admin.id,
          questions: {
            create: questionIds.map((questionId, index) => ({
              questionId,
              questionOrder: index,
            })),
          },
        },
        include: {
          questions: true,
        },
      });

      createdTest = {
        id: createdMockTest.id,
        title: createdMockTest.title,
        questionCount: createdMockTest.questions.length,
      };
    }

    return NextResponse.json(
      {
        created: questionIds.length,
        skippedRows,
        test: createdTest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CSV import failed", error);
    return NextResponse.json({ error: "Unable to import the CSV file. Please check the column names and values." }, { status: 500 });
  }
}
