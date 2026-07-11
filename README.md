# GrowEasy AI CRM Importer

An AI-powered CSV Importer built for the GrowEasy Software Developer Internship Assignment.

The application allows users to upload CSV files with different column names and formats, preview the data, and use AI to intelligently map records into the GrowEasy CRM format.

## Features

- Upload CSV files
- Preview CSV data before import
- AI-powered field mapping
- Supports different CSV structures
- Responsive UI
- Displays imported and skipped records
- Error handling and loading states

## Tech Stack

- React + TypeScript (Vite)
- Node.js
- Express.js
- Google Gemini API
- Papa Parse

## Installation

Clone the repository:

```bash
git clone https://github.com/nayak-ashu/ai-csv-crm-importer/tree/master
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file and add your API key:

```env
GEMINI_API_KEY=your_api_key
```

## Project Structure

```
├── assets/
├── src/
├── server.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Author

**Ashutosh Nayak**

Submitted as part of the **GrowEasy Software Developer Internship Assignment**.
