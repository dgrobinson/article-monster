#!/usr/bin/env python3
"""
Test script for AI summarization functionality.
Run this script to verify your AI setup is working correctly.

Usage:
    python test_ai_summarization.py
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add the parent directory to Python path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ai_summarization_service import (
    AISummarizationService, 
    AIProvider, 
    SummaryType,
    generate_ai_summaries
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test article content
TEST_CONTENT = """
Artificial intelligence (AI) is rapidly transforming the way we work, communicate, and solve complex problems. 
From machine learning algorithms that can detect patterns in vast datasets to natural language processing 
systems that can understand and generate human-like text, AI technologies are becoming increasingly 
sophisticated and accessible.

One of the most significant developments in recent years has been the emergence of large language models 
(LLMs) like GPT-3, GPT-4, and Claude. These models, trained on massive amounts of text data, can perform 
a wide variety of tasks including writing, analysis, coding, and creative work. They represent a significant 
leap forward in AI capabilities and have sparked both excitement and concern about the future of human work.

The applications of AI are virtually limitless. In healthcare, AI systems are being used to analyze medical 
images, predict disease outcomes, and assist in drug discovery. In finance, algorithmic trading and fraud 
detection systems rely heavily on AI. In transportation, autonomous vehicles use AI to navigate complex 
environments safely. Even in creative fields, AI is being used to generate art, music, and literature.

However, the rapid advancement of AI also raises important questions about ethics, job displacement, and 
the need for proper regulation. As AI systems become more powerful and autonomous, ensuring they remain 
aligned with human values and under human control becomes increasingly critical. Organizations and 
governments worldwide are grappling with how to harness the benefits of AI while mitigating potential risks.

The future of AI development will likely focus on creating more efficient, interpretable, and safe systems. 
Research areas like explainable AI, AI safety, and human-AI collaboration are becoming increasingly important. 
As we continue to integrate AI into various aspects of our lives, the key will be finding the right balance 
between innovation and responsibility.
"""

async def test_ai_service():
    """Test the AI summarization service"""
    logger.info("Testing AI Summarization Service")
    logger.info("=" * 50)
    
    try:
        async with AISummarizationService() as service:
            # Test configuration
            provider, model = service.get_provider_info()
            logger.info(f"Using provider: {provider}, model: {model}")
            
            # Test summarization
            logger.info("Generating summaries...")
            summaries = await service.generate_summaries(
                content=TEST_CONTENT,
                title="AI and the Future of Technology"
            )
            
            # Display results
            for summary_type, summary in summaries.items():
                if summary:
                    logger.info(f"\n{summary_type.value.upper()} SUMMARY:")
                    logger.info("-" * 30)
                    logger.info(summary)
                else:
                    logger.warning(f"No {summary_type.value} summary generated")
                    
            return True
            
    except Exception as e:
        logger.error(f"AI summarization test failed: {e}")
        return False

async def test_specific_provider(provider: AIProvider):
    """Test a specific AI provider"""
    logger.info(f"\nTesting {provider.value} provider...")
    
    try:
        async with AISummarizationService() as service:
            summaries = await service.generate_summaries(
                content=TEST_CONTENT[:1000],  # Shorter content for specific test
                title="AI Test Article",
                provider=provider
            )
            
            brief_summary = summaries.get(SummaryType.BRIEF)
            if brief_summary:
                logger.info(f"✅ {provider.value} test successful")
                logger.info(f"Sample brief summary: {brief_summary[:100]}...")
                return True
            else:
                logger.warning(f"❌ {provider.value} test failed - no summary generated")
                return False
                
    except Exception as e:
        logger.error(f"❌ {provider.value} test failed: {e}")
        return False

def check_configuration():
    """Check AI configuration"""
    logger.info("Checking AI Configuration")
    logger.info("=" * 30)
    
    # Check environment variables
    config_items = [
        ("AI_PROVIDER", os.getenv("AI_PROVIDER", "Not set")),
        ("OPENAI_API_KEY", "Set" if os.getenv("OPENAI_API_KEY") else "Not set"),
        ("ANTHROPIC_API_KEY", "Set" if os.getenv("ANTHROPIC_API_KEY") else "Not set"),
        ("LOCAL_MODEL_URL", os.getenv("LOCAL_MODEL_URL", "Not set")),
    ]
    
    for key, value in config_items:
        logger.info(f"{key}: {value}")
    
    # Check if at least one provider is configured
    openai_configured = bool(os.getenv("OPENAI_API_KEY"))
    anthropic_configured = bool(os.getenv("ANTHROPIC_API_KEY"))
    local_configured = bool(os.getenv("LOCAL_MODEL_URL"))
    
    if not (openai_configured or anthropic_configured or local_configured):
        logger.error("❌ No AI provider is properly configured!")
        logger.error("Please set up at least one AI provider. See AI_SUMMARIZATION_SETUP.md")
        return False
    
    logger.info("✅ At least one AI provider is configured")
    return True

async def main():
    """Main test function"""
    logger.info("AI Summarization Test Suite")
    logger.info("=" * 50)
    
    # Check configuration
    if not check_configuration():
        sys.exit(1)
    
    # Test default service
    logger.info("\nTesting default AI service...")
    success = await test_ai_service()
    
    if not success:
        logger.error("❌ Default AI service test failed")
        sys.exit(1)
    
    # Test specific providers if configured
    providers_to_test = []
    
    if os.getenv("OPENAI_API_KEY"):
        providers_to_test.append(AIProvider.OPENAI)
    
    if os.getenv("ANTHROPIC_API_KEY"):
        providers_to_test.append(AIProvider.ANTHROPIC)
    
    if os.getenv("LOCAL_MODEL_URL"):
        providers_to_test.append(AIProvider.LOCAL)
    
    for provider in providers_to_test:
        await test_specific_provider(provider)
    
    logger.info("\n" + "=" * 50)
    logger.info("✅ AI Summarization tests completed!")
    logger.info("Your AI setup appears to be working correctly.")
    logger.info("You can now process articles with AI-powered summaries.")

if __name__ == "__main__":
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        logger.warning("python-dotenv not available, using system environment variables")
    
    asyncio.run(main())