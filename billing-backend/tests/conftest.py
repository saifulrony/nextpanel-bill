"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

# Create test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_client(db_session):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
def authenticated_client(test_client):
    """Create an authenticated test client"""
    # Register and login
    test_client.post("/api/v1/auth/register", json={
        "email": "testuser@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    })
    
    response = test_client.post("/api/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "testpassword123"
    })
    
    token = response.json()["access_token"]
    test_client.headers["Authorization"] = f"Bearer {token}"
    
    return test_client

