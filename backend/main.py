import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from google import genai
import PyPDF2
import docx
from io import BytesIO
import json

# Initialize the app
app = FastAPI(title="Resume Analyzer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDfBObnfVe6Dg9BHRPRu8H_Fs8yQG3qg8Q")
genai_client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.0-flash"

class ResumeAnalysisResponse(BaseModel):
    score: int
    analysis: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[dict]

@app.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    job_title: Optional[str] = Form(None),
    industry: Optional[str] = Form(None)
):
    try:
        # Extract text from resume
        content = await file.read()
        resume_text = extract_text_from_file(content, file.filename)
        
        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from the resume file")
        
        # Generate analysis using Gemini
        analysis_result = generate_resume_analysis(resume_text, job_title, industry)
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text from PDF or DOCX file."""
    file_extension = filename.split('.')[-1].lower()
    
    if file_extension == 'pdf':
        return extract_text_from_pdf(content)
    elif file_extension in ['docx', 'doc']:
        return extract_text_from_docx(content)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {file_extension}")

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        doc = docx.Document(BytesIO(content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from DOCX: {str(e)}")

def generate_resume_analysis(resume_text: str, job_title: Optional[str], industry: Optional[str]) -> ResumeAnalysisResponse:
    """Generate resume analysis using Gemini."""
    context = ""
    if job_title:
        context += f"The resume is for a {job_title} position. "
    if industry:
        context += f"The industry is {industry}. "
    
    prompt = f"""
    Analyze the following resume {context}and provide a comprehensive evaluation:

    RESUME TEXT:
    {resume_text}

    Please provide your analysis in JSON format with the following structure:
    {{
        "score": [integer between 1-100],
        "analysis": [overall analysis of the resume in 3-5 paragraphs],
        "strengths": [list of strengths, each as a string],
        "weaknesses": [list of weaknesses, each as a string],
        "suggestions": [
            {{
                "area": [area of improvement],
                "suggestion": [detailed suggestion],
                "example": [example of how to implement the suggestion]
            }}
        ]
    }}

    Your score should be based on the following criteria:
    - Content relevance and quality (30%)
    - Structure and format (20%)
    - Achievement focus and quantifiable results (25%)
    - Skills and qualifications match (15%)
    - Grammar and clarity (10%)

    Provide actionable suggestions with specific examples for improvement.
    """
    
    try:
        response = genai_client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt]
        )
        
        if not response.text:
            raise HTTPException(status_code=500, detail="No response received from Gemini API")
        
        # Extract the JSON object from the response
        json_str = response.text
        
        # Handle case where the response might include markdown code fences
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
            
        result = json.loads(json_str)
        
        # Ensure the response has all required fields
        return ResumeAnalysisResponse(
            score=result.get("score", 0),
            analysis=result.get("analysis", ""),
            strengths=result.get("strengths", []),
            weaknesses=result.get("weaknesses", []),
            suggestions=result.get("suggestions", [])
        )
        
    except Exception as e:
        print(f"Error with Gemini API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating analysis: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
