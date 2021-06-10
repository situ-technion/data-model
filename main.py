import os
import model
from fastapi import FastAPI, Body, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from typing import Optional, List

app = FastAPI()
app.mount("/statics", StaticFiles(directory="statics"), name="statics")

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


@app.get("/model")
def root():
    model.Model()
