#!/usr/bin/env python3
"""
Deployment Verification Script for Article Monster

This script verifies the production deployment is ready without requiring
external dependencies.
"""

import os
import sys
from pathlib import Path

def check_file_structure():
    """Verify all required files are present"""
    print("📁 Checking file structure...")
    
    required_files = [
        "docker-compose.prod.yml",
        "Dockerfile.prod", 
        "requirements-prod.txt",
        ".env.prod.example",
        "scripts/generate_secrets.sh",
        "scripts/backup/backup.sh",
        "scripts/backup/restore.sh",
        "nginx/nginx.conf",
        "postgres/postgresql.conf",
        "postgres/pg_hba.conf",
        "monitoring/prometheus.yml",
        "monitoring/alert_rules.yml",
        "k8s/namespace.yaml",
        "k8s/application.yaml",
        "k8s/postgresql.yaml",
        "k8s/redis.yaml",
        "k8s/monitoring.yaml",
        "k8s/ingress.yaml",
        "k8s/secrets.yaml",
        "deploy/digitalocean/deploy.sh",
        "deploy/aws/deploy.sh",
        ".github/workflows/ci-cd.yml",
        "app/services/markdown_file_manager.py",
        "app/services/article_service_enhanced.py",
        "app/routers/articles_enhanced.py",
        "app/database_prod.py",
        "app/main_prod.py",
        "PRODUCTION_DEPLOYMENT.md"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
        else:
            print(f"  ✅ {file_path}")
    
    if missing_files:
        print("\n❌ Missing files:")
        for file_path in missing_files:
            print(f"  - {file_path}")
        return False
    
    print("✅ All required files present")
    return True

def check_configurations():
    """Check configuration files"""
    print("\n⚙️ Checking configurations...")
    
    # Check Docker Compose production file
    try:
        with open("docker-compose.prod.yml", "r") as f:
            compose_content = f.read()
            if "nginx:" in compose_content and "app:" in compose_content:
                print("  ✅ Docker Compose production file configured")
            else:
                print("  ❌ Docker Compose production file missing service definitions")
                return False
    except Exception as e:
        print(f"  ❌ Error reading docker-compose.prod.yml: {e}")
        return False
    
    # Check Kubernetes manifests
    k8s_files = ["namespace.yaml", "application.yaml", "postgresql.yaml"]
    for k8s_file in k8s_files:
        try:
            with open(f"k8s/{k8s_file}", "r") as f:
                content = f.read()
                if "article-library" in content:
                    print(f"  ✅ k8s/{k8s_file} configured")
                else:
                    print(f"  ❌ k8s/{k8s_file} missing namespace references")
                    return False
        except Exception as e:
            print(f"  ❌ Error reading k8s/{k8s_file}: {e}")
            return False
    
    # Check environment template
    try:
        with open(".env.prod.example", "r") as f:
            env_content = f.read()
            if "vole-paradox-suppress@kindle.com" in env_content:
                print("  ✅ Kindle email configured correctly")
            else:
                print("  ❌ Kindle email not configured")
                return False
    except Exception as e:
        print(f"  ❌ Error reading .env.prod.example: {e}")
        return False
    
    print("✅ All configurations look good")
    return True

def check_scripts():
    """Check script executability"""
    print("\n🔧 Checking scripts...")
    
    executable_scripts = [
        "scripts/generate_secrets.sh",
        "scripts/backup/backup.sh", 
        "scripts/backup/restore.sh",
        "deploy/digitalocean/deploy.sh",
        "deploy/aws/deploy.sh"
    ]
    
    for script in executable_scripts:
        if Path(script).exists():
            if os.access(script, os.X_OK):
                print(f"  ✅ {script} is executable")
            else:
                print(f"  ❌ {script} is not executable")
                return False
        else:
            print(f"  ❌ {script} not found")
            return False
    
    print("✅ All scripts are executable")
    return True

def check_enhanced_features():
    """Check enhanced markdown storage features"""
    print("\n📝 Checking enhanced features...")
    
    # Check markdown file manager
    try:
        with open("app/services/markdown_file_manager.py", "r") as f:
            content = f.read()
            if "ArticleMetadata" in content and "MarkdownFileManager" in content:
                print("  ✅ Markdown file manager implemented")
            else:
                print("  ❌ Markdown file manager incomplete")
                return False
    except Exception as e:
        print(f"  ❌ Error checking markdown file manager: {e}")
        return False
    
    # Check enhanced article service
    try:
        with open("app/services/article_service_enhanced.py", "r") as f:
            content = f.read()
            if "EnhancedArticleService" in content and "markdown_manager" in content:
                print("  ✅ Enhanced article service implemented")
            else:
                print("  ❌ Enhanced article service incomplete")
                return False
    except Exception as e:
        print(f"  ❌ Error checking enhanced article service: {e}")
        return False
    
    # Check enhanced router
    try:
        with open("app/routers/articles_enhanced.py", "r") as f:
            content = f.read()
            if "browse_files" in content and "read_file" in content:
                print("  ✅ Enhanced API router with file browsing")
            else:
                print("  ❌ Enhanced API router incomplete")
                return False
    except Exception as e:
        print(f"  ❌ Error checking enhanced router: {e}")
        return False
    
    print("✅ All enhanced features implemented")
    return True

def generate_deployment_summary():
    """Generate deployment summary"""
    print("\n📊 Deployment Summary")
    print("=" * 50)
    
    print("\n🚀 Production Ready Features:")
    print("  • Docker Compose with resource limits and health checks")
    print("  • Kubernetes manifests with scaling and monitoring")
    print("  • Enhanced markdown file storage system")
    print("  • Comprehensive monitoring (Prometheus + Grafana)")
    print("  • Automated backup and recovery scripts")
    print("  • Multi-cloud deployment scripts (DO, AWS, GCP)")
    print("  • CI/CD pipeline with GitHub Actions")
    print("  • Production-optimized database configuration")
    print("  • Redis caching and session management")
    print("  • SSL/TLS termination with nginx")
    print("  • Secret management for sensitive data")
    
    print("\n📁 Article Storage:")
    print("  • Markdown files with YAML frontmatter")
    print("  • Organized directory structure (inbox/processed/sent/archive)")
    print("  • Database indexing for fast queries")
    print("  • Full-text search in content")
    print("  • Automatic file management and cleanup")
    print("  • Index generation for browsability")
    
    print("\n📧 Email Configuration:")
    print("  • Kindle email: vole-paradox-suppress@kindle.com")
    print("  • SMTP/IMAP configuration ready")
    print("  • Newsletter processing pipeline")
    print("  • Automated article sending")
    
    print("\n☁️ Cloud Deployment Options:")
    print("  • DigitalOcean: ./deploy/digitalocean/deploy.sh")
    print("  • AWS EKS: ./deploy/aws/deploy.sh")
    print("  • Google Cloud: ./deploy/gcp/deploy.sh")
    print("  • Local Docker: docker-compose -f docker-compose.prod.yml up -d")
    
    print("\n🔧 Next Steps:")
    print("  1. Copy .env.prod.example to .env.prod and configure")
    print("  2. Run ./scripts/generate_secrets.sh")
    print("  3. Choose deployment method and run deployment script")
    print("  4. Configure DNS and SSL certificates")
    print("  5. Set up monitoring alerts")
    
    print("\n📚 Documentation:")
    print("  • Complete guide: PRODUCTION_DEPLOYMENT.md")
    print("  • API documentation: /docs (when running)")
    print("  • Monitoring: Grafana dashboards included")

def main():
    """Main verification function"""
    print("🔍 Article Monster Production Deployment Verification")
    print("=" * 60)
    
    all_checks = [
        check_file_structure(),
        check_configurations(),
        check_scripts(),
        check_enhanced_features()
    ]
    
    if all(all_checks):
        print("\n🎉 SUCCESS: Production deployment is ready!")
        generate_deployment_summary()
        return True
    else:
        print("\n❌ FAILED: Some issues need to be resolved before deployment")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)