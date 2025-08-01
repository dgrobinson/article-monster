#!/usr/bin/env python3
"""
Simple test script for the enhanced markdown storage system
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_markdown_system():
    """Test the markdown file storage system"""
    print("🧪 Testing Enhanced Article Library Markdown System")
    print("=" * 60)
    
    # Create temporary directory for testing
    test_dir = tempfile.mkdtemp(prefix='article_library_test_')
    print(f"📁 Test directory: {test_dir}")
    
    try:
        # Import required modules
        from services.markdown_file_manager import MarkdownFileManager, ArticleMetadata
        print("✅ Successfully imported markdown file manager")
        
        # Initialize manager with test directory
        manager = MarkdownFileManager(test_dir)
        print("✅ Markdown file manager initialized")
        
        # Create test article metadata
        metadata = ArticleMetadata(
            title="Test Article: Production Deployment Guide",
            url="https://example.com/production-deployment",
            author="Article Library System",
            source="test",
            tags=["test", "production", "deployment"]
        )
        print("✅ Article metadata created")
        
        # Test content
        content = """# Production Deployment Guide

This is a test article to verify the markdown storage system is working correctly.

## Features Tested

- Markdown file creation with YAML frontmatter
- Directory structure organization
- File path generation
- Content storage and retrieval

## Configuration

The system is configured with:
- Kindle email: vole-paradox-suppress@kindle.com
- Storage: Markdown files with database indexing
- Organization: Year/month directory structure

## Next Steps

1. Deploy to production
2. Configure monitoring
3. Set up automated backups
"""
        
        # Save article
        file_path = manager.save_article(metadata, content, "inbox")
        print(f"✅ Article saved to: {file_path}")
        
        # Verify file exists
        if file_path.exists():
            print("✅ File exists on disk")
        else:
            print("❌ File not found on disk")
            return False
        
        # Load article back
        loaded_metadata, loaded_content = manager.load_article(file_path)
        print("✅ Article loaded successfully")
        
        # Verify content
        if loaded_metadata.title == metadata.title:
            print("✅ Title matches")
        else:
            print(f"❌ Title mismatch: {loaded_metadata.title} != {metadata.title}")
            return False
        
        if loaded_metadata.url == metadata.url:
            print("✅ URL matches")
        else:
            print(f"❌ URL mismatch: {loaded_metadata.url} != {metadata.url}")
            return False
        
        if "Production Deployment Guide" in loaded_content:
            print("✅ Content matches")
        else:
            print("❌ Content mismatch")
            return False
        
        # Test moving article to processed
        new_path = manager.move_article(file_path, "processed")
        print(f"✅ Article moved to processed: {new_path}")
        
        # Test listing articles
        articles = manager.list_articles()
        if len(articles) >= 1:
            print(f"✅ Found {len(articles)} articles")
        else:
            print("❌ No articles found")
            return False
        
        # Test search
        search_results = manager.search_articles("deployment", in_content=True)
        if len(search_results) >= 1:
            print(f"✅ Search found {len(search_results)} articles")
        else:
            print("❌ Search returned no results")
            return False
        
        # Test statistics
        stats = manager.get_statistics()
        print(f"✅ Statistics: {stats}")
        
        # Test index creation
        manager.create_index_files()
        readme_path = Path(test_dir) / "README.md"
        if readme_path.exists():
            print("✅ Index files created")
        else:
            print("❌ Index files not created")
            return False
        
        print("\n🎉 All tests passed!")
        print("\n📊 Test Results Summary:")
        print("========================")
        print(f"• Articles directory: {test_dir}")
        print(f"• Test article: {new_path}")
        print(f"• Article count: {stats['total_articles']}")
        print(f"• Processed articles: {stats['processed']}")
        print("• Kindle email configured: vole-paradox-suppress@kindle.com")
        
        # Show directory structure
        print("\n📂 Directory Structure:")
        for root, dirs, files in os.walk(test_dir):
            level = root.replace(test_dir, '').count(os.sep)
            indent = ' ' * 2 * level
            print(f"{indent}{os.path.basename(root)}/")
            subindent = ' ' * 2 * (level + 1)
            for file in files:
                print(f"{subindent}{file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        if os.path.exists(test_dir):
            shutil.rmtree(test_dir)
            print(f"\n🧹 Cleaned up test directory: {test_dir}")

if __name__ == "__main__":
    success = test_markdown_system()
    sys.exit(0 if success else 1)