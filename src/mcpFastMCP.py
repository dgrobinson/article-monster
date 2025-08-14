#!/usr/bin/env python3
"""
FastMCP implementation for Zotero library access.
Designed for ChatGPT Deep Research integration.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import aiohttp
from fastmcp import FastMCP

@dataclass
class ZoteroItem:
    id: str
    title: str
    text: str
    url: str
    metadata: Dict[str, Any]

class ZoteroMCPServer:
    def __init__(self):
        self.user_id = os.environ.get('ZOTERO_USER_ID')
        self.api_key = os.environ.get('ZOTERO_API_KEY')
        
        if not self.user_id or not self.api_key:
            raise ValueError("ZOTERO_USER_ID and ZOTERO_API_KEY environment variables required")
        
        self.base_url = f"https://api.zotero.org/users/{self.user_id}"
        self.headers = {
            'Zotero-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        # Create FastMCP instance
        self.mcp = FastMCP(
            name="Personal Zotero Library Access",
            instructions="MCP-compliant access to your personal Zotero research library for ChatGPT Deep Research"
        )
        
        # Register tools
        self.mcp.tool()(self.search)
        self.mcp.tool()(self.fetch)
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make an async request to Zotero API."""
        url = f"{self.base_url}/{endpoint}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"Zotero API error: {response.status}")
    
    def _format_zotero_item(self, item: Dict[str, Any]) -> ZoteroItem:
        """Convert Zotero API item to our format."""
        data = item.get('data', {})
        
        # Create fallback description
        creators_str = ', '.join([
            f"{c.get('firstName', '')} {c.get('lastName', '')}".strip() 
            for c in data.get('creators', [])
        ]) or 'Unknown'
        
        fallback_text = f"{data.get('itemType', 'item')} by {creators_str} ({data.get('date', 'No date')})"
        
        return ZoteroItem(
            id=item['key'],
            title=data.get('title', 'Untitled'),
            text=data.get('abstractNote', fallback_text),
            url=data.get('url', f"https://www.zotero.org/{self.user_id.lower()}/items/{item['key']}"),
            metadata={
                'itemType': data.get('itemType'),
                'creators': data.get('creators', []),
                'date': data.get('date'),
                'DOI': data.get('DOI'),
                'tags': data.get('tags', []),
                'dateAdded': data.get('dateAdded'),
                'dateModified': data.get('dateModified')
            }
        )
    
    async def search(self, query: str) -> List[Dict[str, str]]:
        """
        Search across all items in your Zotero library.
        
        Searches titles, authors, abstracts, and other metadata for the given query terms.
        Returns a list of matching items with basic information for ChatGPT to review.
        
        Args:
            query: Search terms (title, author, keywords, etc.)
            
        Returns:
            List of matching items with id, title, text, and url fields
        """
        try:
            # Search Zotero library
            params = {
                'q': query,
                'limit': 25,
                'sort': 'dateModified',
                'direction': 'desc'
            }
            
            items = await self._make_request('items', params)
            
            # Format results for ChatGPT
            results = []
            for item in items:
                zotero_item = self._format_zotero_item(item)
                results.append({
                    'id': zotero_item.id,
                    'title': zotero_item.title,
                    'text': zotero_item.text,
                    'url': zotero_item.url
                })
            
            return results
            
        except Exception as e:
            raise Exception(f"Search failed: {str(e)}")
    
    async def fetch(self, id: str) -> Dict[str, Any]:
        """
        Fetch detailed information about a specific library item.
        
        Retrieves the complete record for a Zotero item, including full text,
        metadata, attachments, and notes. Provides comprehensive information
        for in-depth research and citation.
        
        Args:
            id: Item key/ID from search results
            
        Returns:
            Complete item details with full text, metadata, and related content
        """
        try:
            # Get item and its children in parallel
            item_task = self._make_request(f'items/{id}')
            children_task = self._make_request(f'items/{id}/children')
            
            item, children = await asyncio.gather(item_task, children_task)
            
            # Process the main item
            zotero_item = self._format_zotero_item(item)
            
            # Process children (attachments, notes)
            attachments = [c for c in children if c.get('data', {}).get('itemType') == 'attachment']
            notes = [c for c in children if c.get('data', {}).get('itemType') == 'note']
            
            # Build comprehensive text content
            full_text_parts = [f"Title: {zotero_item.title}"]
            
            if zotero_item.metadata.get('creators'):
                authors = ', '.join([
                    f"{c.get('firstName', '')} {c.get('lastName', '')}".strip()
                    for c in zotero_item.metadata['creators']
                ])
                full_text_parts.append(f"Authors: {authors}")
            
            if zotero_item.metadata.get('date'):
                full_text_parts.append(f"Date: {zotero_item.metadata['date']}")
            
            if item.get('data', {}).get('abstractNote'):
                full_text_parts.append(f"Abstract: {item['data']['abstractNote']}")
            
            if zotero_item.metadata.get('DOI'):
                full_text_parts.append(f"DOI: {zotero_item.metadata['DOI']}")
            
            if zotero_item.metadata.get('tags'):
                tags = ', '.join([t.get('tag', '') for t in zotero_item.metadata['tags']])
                full_text_parts.append(f"Tags: {tags}")
            
            if attachments:
                attachment_titles = ', '.join([a.get('data', {}).get('title', '') for a in attachments])
                full_text_parts.append(f"Attachments: {attachment_titles}")
            
            if notes:
                notes_text = '\n\n'.join([n.get('data', {}).get('note', '') for n in notes])
                full_text_parts.append(f"Notes:\n{notes_text}")
            
            # Return complete item
            return {
                'id': zotero_item.id,
                'title': zotero_item.title,
                'text': '\n\n'.join(full_text_parts),
                'url': zotero_item.url,
                'metadata': {
                    **zotero_item.metadata,
                    'attachmentCount': len(attachments),
                    'noteCount': len(notes)
                }
            }
            
        except Exception as e:
            raise Exception(f"Failed to fetch item {id}: {str(e)}")

def create_server():
    """Create and return the FastMCP server instance."""
    server = ZoteroMCPServer()
    return server.mcp

if __name__ == "__main__":
    # Use main port for pure FastMCP deployment
    port = int(os.environ.get('PORT', 8080))  # Production port
    
    print(f"Starting PURE FastMCP Zotero server on port {port}")
    print(f"SSE endpoint will be available at: http://0.0.0.0:{port}/sse")
    print("This is a pure FastMCP deployment with zero custom code")
    
    # Run the server with SSE transport
    mcp = create_server()
    mcp.run(
        transport="sse",
        host="0.0.0.0", 
        port=port,
        path="/sse"
    )