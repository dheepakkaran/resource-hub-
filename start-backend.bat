@echo off
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
