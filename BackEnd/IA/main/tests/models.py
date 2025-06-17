from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./verifications.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Verification(Base):
    __tablename__ = "verifications"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    time = Column(String, index=True)
    result = Column(String)
    confidence = Column(Float)
    reference_image = Column(String)
    test_image = Column(String)
    processing_time = Column(Float)

Base.metadata.create_all(bind=engine)