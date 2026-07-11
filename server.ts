import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Papa from "papaparse";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import JSZip from "jszip";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload parsing for bulk CSV uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// 0. API: Download full project workspace as ZIP
app.get("/api/download-project", async (req, res) => {
  try {
    const zip = new JSZip();
    const rootDir = process.cwd();

    function recurse(dir: string, relativePath = "") {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = relativePath ? `${relativePath}/${item}` : item;

        // Ignore build folders, node_modules, logs, and specific zip archives
        if (
          item === "node_modules" ||
          item === "dist" ||
          item === ".git" ||
          item === ".github" ||
          item.endsWith(".zip") ||
          item === "package-lock.json" ||
          item === ".env"
        ) {
          continue;
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          recurse(fullPath, relPath);
        } else {
          const content = fs.readFileSync(fullPath);
          zip.file(relPath, content);
        }
      }
    }

    recurse(rootDir);

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=groweasy_crm_project.zip");
    res.send(buffer);
  } catch (error: any) {
    console.error("Project ZIP creation error:", error);
    res.status(500).json({ error: "Failed to compile project workspace ZIP archive." });
  }
});

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not defined. Please add it via the Settings > Secrets panel in Google AI Studio."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Parse CSV raw contents
app.post("/api/parse-csv", (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== "string") {
      return res.status(400).json({ error: "csvText field is required as a string." });
    }

    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: "greedy",
    });

    res.json({
      headers: result.meta.fields || [],
      rows: result.data,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("CSV parse error:", error);
    res.status(500).json({ error: error.message || "Failed to parse CSV." });
  }
});

// JSON schema for CRM extraction
const crmLeadSchema = {
  type: Type.OBJECT,
  properties: {
    records: {
      type: Type.ARRAY,
      description: "List of mapped and standardized CRM leads",
      items: {
        type: Type.OBJECT,
        properties: {
          created_at: {
            type: Type.STRING,
            description: "Date and time the lead was created. MUST be convertible using JavaScript's new Date(created_at), e.g. YYYY-MM-DD HH:MM:SS or ISO 8601.",
          },
          name: {
            type: Type.STRING,
            description: "Full name of the lead. Combine first/last names if separate.",
          },
          email: {
            type: Type.STRING,
            description: "Primary email address. Use only the first email if multiple exist.",
          },
          country_code: {
            type: Type.STRING,
            description: "Country code (e.g., +91, +1, +44) extracted from the phone number or region context.",
          },
          mobile_without_country_code: {
            type: Type.STRING,
            description: "Phone number without the country code and without spaces/symbols. Use only the first number if multiple exist.",
          },
          company: {
            type: Type.STRING,
            description: "Company or Organization name.",
          },
          city: {
            type: Type.STRING,
            description: "City.",
          },
          state: {
            type: Type.STRING,
            description: "State or Region.",
          },
          country: {
            type: Type.STRING,
            description: "Country name.",
          },
          lead_owner: {
            type: Type.STRING,
            description: "Lead owner email, username or full name if specified.",
          },
          crm_status: {
            type: Type.STRING,
            description: "Lead status. MUST be exactly one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.",
          },
          crm_note: {
            type: Type.STRING,
            description: "Any comments, remarks, extra emails, or extra numbers that did not fit standard fields. Escape any line breaks.",
          },
          data_source: {
            type: Type.STRING,
            description: "Data source. MUST be exactly one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. Or leave empty.",
          },
          possession_time: {
            type: Type.STRING,
            description: "Property possession time details (e.g., Immediate, 3 months, 1 year), if available in the data.",
          },
          description: {
            type: Type.STRING,
            description: "Any other details or combined fields. Escape any line breaks.",
          },
          is_valid_lead: {
            type: Type.BOOLEAN,
            description: "Set to false if this row contains NEITHER email NOR mobile number.",
          },
        },
      },
    },
    mapping_explanation: {
      type: Type.STRING,
      description: "A short sentence describing how the key headers were mapped to GrowEasy CRM fields (e.g., 'Mapped client_name to name and phone_num to mobile_without_country_code').",
    },
  },
  required: ["records"],
};

// 2. API: Extract CRM leads using Gemini AI
app.post("/api/extract-leads", async (req, res) => {
  try {
    const { rows, customInstructions } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "rows is required as an array." });
    }

    if (rows.length === 0) {
      return res.json({ records: [], skippedCount: 0, totalCount: 0 });
    }

    const ai = getGeminiClient();

    // Set batch size (e.g., 25 rows per batch) to avoid timeout and token overflows
    const BATCH_SIZE = 25;
    const records: any[] = [];
    let skippedCount = 0;
    const explanations: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batchRows = rows.slice(i, i + BATCH_SIZE);

      const prompt = `
You are an expert CRM Data Integration assistant. Your task is to intelligently parse and map the following list of arbitrary CRM leads into the GrowEasy CRM format according to STRICT AI guidelines.

STRICT AI RULES:
1. Allowed CRM Status Values:
   - crm_status MUST be strictly one of these exact values: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.
   - Do not use any other status values. Map whatever raw status or cue exists to the closest matching option of these four.

2. Allowed Data Source Values:
   - data_source MUST be strictly one of these exact values: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots.
   - If none of these values match confidently, set data_source to an empty string "".

3. Date Format:
   - created_at MUST be convertible using JavaScript: "new Date(created_at)" should not return Invalid Date. Ensure it is formatted as "YYYY-MM-DD HH:MM:SS" (e.g., "2026-05-13 14:20:48") or a valid ISO string.

4. CRM Notes (crm_note):
   - Use crm_note for: Remarks, Follow-up notes, Additional comments, Extra phone numbers, Extra email addresses, and any useful information that doesn't fit another field.

5. Multiple Emails or Mobile Numbers:
   - If multiple email addresses exist in the raw row: Use the first email in the 'email' field. Append any remaining emails into 'crm_note'.
   - If multiple mobile numbers exist in the raw row: Use the first mobile in the 'mobile_without_country_code' field. Append any remaining numbers into 'crm_note'.

6. CSV Compatibility:
   - Each record must remain a single CSV row. Avoid introducing unintended raw line breaks. If line breaks are necessary, escape them as '\\n' so the output remains robust.

7. Skip Invalid Records:
   - If a record contains NEITHER a valid email NOR a mobile number, then skip that record by setting 'is_valid_lead' to false.

GROW_EASY_CRM_TARGET_SCHEMA_FIELDS:
- created_at: Lead creation date/time (Must be JavaScript-convertible new Date() format)
- name: Full name of the lead. Join first name and last name if they are separate.
- email: Primary email (first one only if multiple exist)
- country_code: Country code (e.g., +91, +1, +44, +971, etc.)
- mobile_without_country_code: Mobile number without country code or symbols (first one only if multiple exist)
- company: Company name
- city: City
- state: State
- country: Country
- lead_owner: Lead owner/agent assigned
- crm_status: MUST be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE
- crm_note: Lead notes, remarks or recent discussion logs, extra emails/phones
- data_source: MUST be one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots (or empty "")
- possession_time: Property possession timeline if mentioned
- description: Additional details or combined content from extra unmapped columns

CSV INPUT DATA (BATCH ${Math.floor(i / BATCH_SIZE) + 1}):
${JSON.stringify(batchRows, null, 2)}

${customInstructions ? `USER CUSTOM INSTRUCTIONS:\n${customInstructions}\n` : ""}

INSTRUCTIONS:
1. Carefully study the keys (headers) of the CSV rows. Map them intelligently to the GrowEasy CRM target fields following the STRICT AI RULES.
2. For the phone number, extract the country code (e.g., +91, +1) into 'country_code' and the rest of the digits into 'mobile_without_country_code'. If no country code is found, guess based on country column or leave 'country_code' empty.
3. If a row is entirely empty or is a repeat header, or if it lacks BOTH email and mobile number, set 'is_valid_lead' to false.
4. Try to populate as many target fields as possible. If a field cannot be found, set it to an empty string.
5. Provide a clear mapping_explanation of how headers were mapped.
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: crmLeadSchema,
            temperature: 0.1, // low temperature for precise mapping
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error("No response returned from Gemini.");
        }

        const resultObj = JSON.parse(text.trim());
        const batchRecords = resultObj.records || [];

        batchRecords.forEach((rec: any) => {
          if (rec.is_valid_lead === false) {
            skippedCount++;
          } else {
            // Remove the helper boolean before sending back to frontend
            const { is_valid_lead, ...cleanLead } = rec;
            records.push(cleanLead);
          }
        });

        if (resultObj.mapping_explanation) {
          explanations.push(resultObj.mapping_explanation);
        }
      } catch (batchError: any) {
        console.error(`Error processing batch starting at index ${i}:`, batchError);
        // Fallback: If AI fails for a batch, treat them as skipped rather than failing the whole upload
        skippedCount += batchRows.length;
      }
    }

    // Combine explanations
    const uniqueExplanations = Array.from(new Set(explanations));
    const combinedLog = uniqueExplanations.join("; ") || "Successfully mapped fields automatically using AI.";

    res.json({
      records,
      skippedCount,
      totalCount: rows.length,
      mappingLog: combinedLog,
    });
  } catch (error: any) {
    console.error("AI extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to perform AI CRM mapping." });
  }
});

// Configure Vite integration or static file serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server bootstrap failed:", err);
});
