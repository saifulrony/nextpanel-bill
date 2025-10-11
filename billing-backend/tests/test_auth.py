"""
Tests for authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_register_user(self):
        """Test user registration"""
        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
            "company_name": "Test Company"
        })
        
        assert response.status_code in [201, 400]  # 400 if user exists
        if response.status_code == 201:
            data = response.json()
            assert data["email"] == "test@example.com"
            assert data["full_name"] == "Test User"
            assert "id" in data
    
    def test_login(self):
        """Test user login"""
        # First register
        client.post("/api/v1/auth/register", json={
            "email": "test2@example.com",
            "password": "testpassword123",
            "full_name": "Test User 2"
        })
        
        # Then login
        response = client.post("/api/v1/auth/login", json={
            "email": "test2@example.com",
            "password": "testpassword123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401


class TestPlans:
    """Plan endpoint tests"""
    
    def test_list_plans(self):
        """Test listing all plans"""
        response = client.get("/api/v1/plans/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestHealthCheck:
    """Health check tests"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

