# AI Resume Analyzer

An AI-powered Resume Analyzer that evaluates resumes, extracts key
information, and provides intelligent feedback to improve candidate
profiles. This system helps job seekers optimize their resumes and helps
recruiters quickly analyze candidates.

------------------------------------------------------------------------

## Features

-   Upload resume (PDF/DOCX)
-   Extract resume text automatically
-   Analyze skills, education, and experience
-   Provide AI-based feedback and suggestions
-   Resume scoring system
-   Clean and user-friendly interface
-   Fast and efficient processing

------------------------------------------------------------------------

## Tech Stack

Frontend: - React.js - HTML - CSS - JavaScript

Backend: - Python - FastAPI

Database: - MongoDB

AI / Processing: - Natural Language Processing (NLP)

Version Control: - Git - GitHub

------------------------------------------------------------------------

## Project Structure

Resume-Analyzer-using-AI/

├── frontend/\
├── backend/\
│ └── main.py\
├── README.md\
└── .gitignore

------------------------------------------------------------------------

## Installation and Setup

### Step 1: Clone the repository

git clone
https://github.com/Haaseth-Abhiram/Resume-Analyzer-using-AI.git

### Step 2: Navigate to project folder

cd Resume-Analyzer-using-AI

------------------------------------------------------------------------

## Backend Setup (Using Anaconda Prompt)

Step 1: Open Anaconda Prompt

Step 2: Navigate to project directory

cd Desktop\
cd resume_analyzer\
cd backend

Step 3: Activate environment (if created)

conda activate base

OR (if using custom environment)

conda activate resume_env

Step 4: Run the FastAPI backend server

python main.py

OR using uvicorn:

uvicorn main:app --reload

Step 5: Backend will start at:

http://127.0.0.1:8000

------------------------------------------------------------------------

## Frontend Setup

Step 1: Navigate to frontend folder

cd frontend

Step 2: Install dependencies

npm install

Step 3: Run frontend

npm start

------------------------------------------------------------------------

## How It Works

1.  User uploads resume\
2.  Backend extracts resume content\
3.  AI analyzes resume\
4.  System provides score and suggestions\
5.  Results displayed in frontend

------------------------------------------------------------------------

## Author

Haaseth Abhiram

GitHub:\
https://github.com/Haaseth-Abhiram

------------------------------------------------------------------------

## License

This project is for educational purposes.
