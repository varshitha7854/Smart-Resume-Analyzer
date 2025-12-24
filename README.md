
# Smart Resume Analyzer

A small Flask-based service that extracts text from PDF/DOCX resumes and uses the Google Generative Language API (Gemini / text-bison) to produce a structured JSON resume analysis.

## Features
- Upload PDF or DOCX resumes via web UI
- Extracts resume text (pypdf / python-docx)
- Sends prompt to Google Generative Language API and expects JSON-only response containing: score, strengths, weaknesses, suggestions, sections, formatting_issues, upskilling_recommendations
- Provides a JSON API endpoint for programmatic use: `/api/analyze`

## Tech
- Python 3.11
- Flask
- pypdf, python-docx
- requests, python-dotenv

## Quick start (Windows PowerShell)
1. Open a terminal in the project folder:
```powershell
Set-Location 'D:\Varshithamuthineni.ai\smart-resume-analyzer'
```
2. Create & activate virtualenv (if not already):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
3. Install dependencies:
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```
4. Create a `.env` file (do NOT commit it). Example keys:
```
GOOGLE_API_KEY=REPLACE_ME
GOOGLE_GENERATIVE_MODEL=text-bison-001
```
5. Run the app:
```powershell
python app.py
```
The app listens on port `7860` by default.

## API
- Web UI: `GET /` (upload form)
- JSON API: `POST /api/analyze`
  - form upload: `file` field (multipart/form-data)
  - raw text: JSON body `{ "text": "<resume text>" }`



## Notes
- If your resumes are scanned images (not selectable text), add OCR (Tesseract) before analysis.
- The app expects the model to return JSON-only. If the model returns non-JSON, the API returns the raw output in `raw_output` to help debugging.

## Security
- Never commit `.env` containing API keys. Add `.env` to `.gitignore` (already included).
- If an API key was exposed, rotate it immediately in Google Cloud Console.

## Troubleshooting
- If `ImportError` for `lxml.etree` appears, reinstall `lxml` in the active virtualenv:
```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
.\.venv\Scripts\python.exe -m pip install --force-reinstall --no-cache-dir lxml
```
- Run the app from the project folder (so `.env` is discovered):
```powershell
Set-Location 'D:\Varshithamuthineni.ai\smart-resume-analyzer'
.\.venv\Scripts\Activate.ps1
python app.py
```

## Next steps (suggestions)
- Add OCR (Tesseract) for scanned resumes
- Persist analyses in a database and add a history UI
- Add authentication and rate limiting for the API

---
Created by the developer. Keep secrets out of version control.
