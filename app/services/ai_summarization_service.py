import asyncio
import logging
import os
from typing import Dict, Optional, Tuple
from enum import Enum
from datetime import datetime
import httpx
import json

logger = logging.getLogger(__name__)

class SummaryType(Enum):
    BRIEF = "brief"
    STANDARD = "standard"
    DETAILED = "detailed"

class AIProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"

class AIConfig:
    """Configuration for AI providers"""
    
    def __init__(self):
        # OpenAI Configuration
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        
        # Anthropic Configuration
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.anthropic_model = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
        self.anthropic_base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1")
        
        # Local Model Configuration
        self.local_model_url = os.getenv("LOCAL_MODEL_URL", "http://localhost:11434/api/generate")
        self.local_model_name = os.getenv("LOCAL_MODEL_NAME", "llama2")
        
        # General Configuration
        self.default_provider = AIProvider(os.getenv("AI_PROVIDER", "openai"))
        self.max_retries = int(os.getenv("AI_MAX_RETRIES", "3"))
        self.timeout = int(os.getenv("AI_TIMEOUT", "60"))
        self.enable_fallback = os.getenv("AI_ENABLE_FALLBACK", "true").lower() == "true"

class AIServiceError(Exception):
    """Custom exception for AI service errors"""
    pass

class AISummarizationService:
    """Service for generating AI-powered summaries using multiple providers"""
    
    def __init__(self):
        self.config = AIConfig()
        self.client = httpx.AsyncClient(timeout=self.config.timeout)
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def _get_prompts(self) -> Dict[SummaryType, str]:
        """Get prompts for different summary types"""
        return {
            SummaryType.BRIEF: """Please provide a very concise summary of this article in 1-2 sentences. Focus on the main point or key takeaway.

Article content:
{content}

Brief summary:""",
            
            SummaryType.STANDARD: """Please provide a clear, informative summary of this article in one paragraph (3-5 sentences). Include the main points and key insights.

Article content:
{content}

Standard summary:""",
            
            SummaryType.DETAILED: """Please provide a comprehensive summary of this article in 2-3 paragraphs. Include the main arguments, key evidence, implications, and any important details that readers should know.

Article content:
{content}

Detailed summary:"""
        }
    
    async def generate_summaries(
        self, 
        content: str, 
        title: str = None,
        provider: AIProvider = None
    ) -> Dict[SummaryType, str]:
        """Generate all three types of summaries for an article"""
        
        if not content or len(content.strip()) < 100:
            raise AIServiceError("Content too short for AI summarization")
        
        provider = provider or self.config.default_provider
        prompts = self._get_prompts()
        
        # Truncate content if too long (keep first ~8000 words for context)
        if len(content) > 50000:
            content = content[:50000] + "..."
        
        summaries = {}
        
        for summary_type in [SummaryType.BRIEF, SummaryType.STANDARD, SummaryType.DETAILED]:
            try:
                prompt = prompts[summary_type].format(content=content)
                summary = await self._generate_summary_with_retries(prompt, provider)
                summaries[summary_type] = summary
                
                # Add small delay between requests to be respectful
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Failed to generate {summary_type.value} summary: {e}")
                if self.config.enable_fallback and provider != AIProvider.LOCAL:
                    try:
                        # Try fallback to simple text summary
                        summaries[summary_type] = self._generate_fallback_summary(
                            content, summary_type
                        )
                    except Exception as fallback_error:
                        logger.error(f"Fallback summary failed: {fallback_error}")
                        summaries[summary_type] = None
                else:
                    summaries[summary_type] = None
        
        return summaries
    
    async def _generate_summary_with_retries(
        self, 
        prompt: str, 
        provider: AIProvider
    ) -> str:
        """Generate summary with retry logic"""
        
        for attempt in range(self.config.max_retries):
            try:
                if provider == AIProvider.OPENAI:
                    return await self._call_openai(prompt)
                elif provider == AIProvider.ANTHROPIC:
                    return await self._call_anthropic(prompt)
                elif provider == AIProvider.LOCAL:
                    return await self._call_local_model(prompt)
                else:
                    raise AIServiceError(f"Unsupported provider: {provider}")
                    
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {provider.value}: {e}")
                if attempt == self.config.max_retries - 1:
                    raise AIServiceError(f"All {self.config.max_retries} attempts failed: {e}")
                
                # Exponential backoff
                await asyncio.sleep(2 ** attempt)
        
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        if not self.config.openai_api_key:
            raise AIServiceError("OpenAI API key not configured")
        
        headers = {
            "Authorization": f"Bearer {self.config.openai_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.config.openai_model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500,
            "temperature": 0.3
        }
        
        response = await self.client.post(
            f"{self.config.openai_base_url}/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise AIServiceError(f"OpenAI API error {response.status_code}: {response.text}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
    
    async def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic Claude API"""
        if not self.config.anthropic_api_key:
            raise AIServiceError("Anthropic API key not configured")
        
        headers = {
            "x-api-key": self.config.anthropic_api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.config.anthropic_model,
            "max_tokens": 500,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        response = await self.client.post(
            f"{self.config.anthropic_base_url}/messages",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise AIServiceError(f"Anthropic API error {response.status_code}: {response.text}")
        
        result = response.json()
        return result["content"][0]["text"].strip()
    
    async def _call_local_model(self, prompt: str) -> str:
        """Call local model (e.g., Ollama)"""
        payload = {
            "model": self.config.local_model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 500
            }
        }
        
        response = await self.client.post(
            self.config.local_model_url,
            json=payload
        )
        
        if response.status_code != 200:
            raise AIServiceError(f"Local model error {response.status_code}: {response.text}")
        
        result = response.json()
        return result.get("response", "").strip()
    
    def _generate_fallback_summary(self, content: str, summary_type: SummaryType) -> str:
        """Generate fallback summary using simple text processing"""
        if not content:
            return ""
            
        sentences = content.replace('\n', ' ').split('. ')
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        if summary_type == SummaryType.BRIEF:
            # Return first 1-2 sentences
            return '. '.join(sentences[:2]) + '.'
        elif summary_type == SummaryType.STANDARD:
            # Return first 3-5 sentences
            return '. '.join(sentences[:5]) + '.'
        else:  # DETAILED
            # Return first 8-10 sentences, organized into paragraphs
            selected = sentences[:10]
            mid_point = len(selected) // 2
            para1 = '. '.join(selected[:mid_point]) + '.'
            para2 = '. '.join(selected[mid_point:]) + '.'
            return f"{para1}\n\n{para2}"
    
    def get_provider_info(self, provider: AIProvider = None) -> Tuple[str, str]:
        """Get provider and model information"""
        provider = provider or self.config.default_provider
        
        if provider == AIProvider.OPENAI:
            return provider.value, self.config.openai_model
        elif provider == AIProvider.ANTHROPIC:
            return provider.value, self.config.anthropic_model
        elif provider == AIProvider.LOCAL:
            return provider.value, self.config.local_model_name
        
        return "unknown", "unknown"

# Convenience function for easy import
async def generate_ai_summaries(
    content: str, 
    title: str = None, 
    provider: AIProvider = None
) -> Dict[SummaryType, str]:
    """Convenience function to generate AI summaries"""
    async with AISummarizationService() as service:
        return await service.generate_summaries(content, title, provider)