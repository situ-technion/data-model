import uvicorn
from fastapi import  FastAPI


# initalize app
app = FastAPI()


@app.get("/")
def hello():
    return {"message":"Hello TutLinks.com"}
