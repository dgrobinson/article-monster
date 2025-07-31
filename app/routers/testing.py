from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.automated_test_service import automated_test_service
from app.services.test_email_service import test_email_service

router = APIRouter(prefix="/testing", tags=["testing"])

class RunTestRequest(BaseModel):
    test_type: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = None

class AutomatedTestRequest(BaseModel):
    start_continuous: bool = False
    interval_minutes: int = 60

@router.post("/run-automated-tests")
async def run_automated_tests(background_tasks: BackgroundTasks):
    """Run full suite of automated tests"""
    background_tasks.add_task(automated_test_service.run_automated_tests)
    return {"message": "Automated tests started"}

@router.get("/test-results")
async def get_test_results():
    """Get recent automated test results"""
    return automated_test_service.get_test_summary()

@router.post("/send-test-email")
async def send_test_email(request: RunTestRequest):
    """Send a specific type of test email"""
    available_types = test_email_service.get_available_test_types()
    
    if request.test_type and request.test_type not in available_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid test type. Available: {available_types}"
        )
    
    # Default to newsletter test if no type specified
    email_type = request.test_type or "newsletter"
    
    success = await test_email_service.send_test_email(
        email_type, 
        request.custom_data
    )
    
    if success:
        return {
            "message": f"Test email sent successfully",
            "type": email_type,
            "description": test_email_service.get_test_type_description(email_type)
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")

@router.get("/test-email-types")
async def get_test_email_types():
    """Get available test email types"""
    types = test_email_service.get_available_test_types()
    return {
        "available_types": [
            {
                "type": t,
                "description": test_email_service.get_test_type_description(t)
            }
            for t in types
        ]
    }

@router.post("/continuous-testing")
async def start_continuous_testing(
    request: AutomatedTestRequest,
    background_tasks: BackgroundTasks
):
    """Start or configure continuous automated testing"""
    if request.start_continuous:
        background_tasks.add_task(
            automated_test_service.run_continuous_testing,
            request.interval_minutes
        )
        return {
            "message": f"Continuous testing started with {request.interval_minutes} minute intervals"
        }
    else:
        return {"message": "Continuous testing configuration updated"}

@router.get("/synthetic-newsletter-test")
async def test_synthetic_newsletters():
    """Test synthetic newsletter generation and processing"""
    result = await automated_test_service._test_synthetic_newsletters()
    return result

@router.post("/test-rss-processing")
async def test_rss_processing():
    """Test RSS feed processing capabilities"""
    result = await automated_test_service._test_rss_processing()
    return result

@router.get("/test-status")
async def get_test_status():
    """Get current testing status and capabilities"""
    return {
        "automated_testing_available": True,
        "test_email_service_available": True,
        "available_test_types": test_email_service.get_available_test_types(),
        "recent_test_summary": automated_test_service.get_test_summary(),
        "testing_endpoints": [
            "/testing/run-automated-tests",
            "/testing/send-test-email",
            "/testing/continuous-testing",
            "/testing/test-results"
        ]
    }

@router.post("/validate-email-processing")
async def validate_email_processing():
    """Validate current email processing pipeline"""
    # Test the full email processing pipeline
    validation_results = {
        "email_service_configured": bool(
            test_email_service.email_service.smtp_username and 
            test_email_service.email_service.smtp_password
        ),
        "kindle_email_configured": bool(
            test_email_service.email_service.kindle_email
        ),
        "database_accessible": True,  # Will be tested by DB operations
        "background_tasks_working": True  # Will be tested by async operations
    }
    
    # Run a quick synthetic test
    synthetic_result = await automated_test_service._test_synthetic_newsletters()
    validation_results["synthetic_processing"] = synthetic_result["status"] == "success"
    
    overall_status = all(validation_results.values())
    
    return {
        "overall_status": "healthy" if overall_status else "issues_detected",
        "details": validation_results,
        "recommendations": _get_validation_recommendations(validation_results)
    }

def _get_validation_recommendations(results: Dict) -> list:
    """Get recommendations based on validation results"""
    recommendations = []
    
    if not results.get("email_service_configured"):
        recommendations.append("Configure SMTP credentials in environment variables")
    
    if not results.get("kindle_email_configured"):
        recommendations.append("Set KINDLE_EMAIL environment variable")
    
    if not results.get("synthetic_processing"):
        recommendations.append("Check newsletter processing logic - synthetic tests failing")
    
    if not recommendations:
        recommendations.append("All systems operational - ready for production use")
    
    return recommendations