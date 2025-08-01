# Deployment Guide

## Overview

This system runs as a containerized application that monitors email, processes articles, and forwards them to your Kindle. Here are deployment options:

## Cloud Deployment Options

### Option 1: DigitalOcean App Platform (Recommended)
- **Cost**: ~$12/month for basic setup
- **Pros**: Managed database, easy deployment, auto-scaling
- **Cons**: Less control over environment

### Option 2: AWS ECS/Fargate
- **Cost**: ~$15-30/month depending on usage
- **Pros**: Highly scalable, full AWS integration
- **Cons**: More complex setup

### Option 3: Google Cloud Run
- **Cost**: ~$10-20/month
- **Pros**: Serverless, pay-per-use
- **Cons**: Cold starts, timeout limits

### Option 4: Railway/Render
- **Cost**: ~$15-25/month
- **Pros**: Simple deployment, managed databases
- **Cons**: Less mature than major providers

## Email Setup Requirements

### 1. Create Dedicated Gmail Account (Recommended)
```
Email: articles@yourdomain.com (or use Gmail)
Purpose: Receives newsletters, FiveFilters emails, forwards
```

### 2. Configure Gmail App Password
1. Enable 2FA on the Gmail account
2. Generate App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use this password (not your regular Gmail password)

### 3. Kindle Email Setup
1. Find your Kindle email: Amazon → Manage Your Content → Preferences → Personal Document Settings
2. Add your processing email to approved senders list
3. Test by sending a document manually

## Quick Deploy to DigitalOcean

### 1. Prepare Repository
```bash
git clone your-repo
cd article-monster
```

### 2. Create App on DigitalOcean
1. Go to DigitalOcean App Platform
2. Create new app from GitHub repository
3. Choose "Dockerfile" as build method

### 3. Configure Environment Variables
Add these in DigitalOcean app settings:
```
SMTP_USERNAME=your-processing-email@gmail.com
SMTP_PASSWORD=your-app-password
KINDLE_EMAIL=your-kindle@kindle.com
FROM_EMAIL=your-processing-email@gmail.com
PROCESSING_EMAIL=your-processing-email@gmail.com
```

### 4. Add Database
- Add PostgreSQL database addon ($15/month)
- DigitalOcean will automatically set DATABASE_URL

### 5. Add Redis
- Add Redis addon ($15/month)
- DigitalOcean will automatically set REDIS_URL

### 6. Deploy
- App will automatically deploy and start monitoring emails

## Usage Workflows

### Workflow 1: FiveFilters Integration
1. **Before**: FiveFilters → Kindle
2. **After**: FiveFilters → Your Processing Email → Enhanced Processing → Kindle

Configure FiveFilters to send to your processing email instead of directly to Kindle.

### Workflow 2: Newsletter Forwarding
```
You receive newsletter → Forward to processing email → System extracts articles → Sends to Kindle
```

Example: Forward Morning Brew, The Hustle, etc. to your processing email.

### Workflow 3: Manual Article Processing
```
Find interesting article → Forward URL to processing email → Enhanced extraction → Kindle
```

### Workflow 4: Direct URL Processing
```bash
curl -X POST "https://your-app.ondigitalocean.app/api/v1/articles/process-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article", "send_to_kindle": true}'
```

## Email Forwarding Examples

### Forward a Newsletter
```
To: your-processing-email@gmail.com
Subject: Fwd: Morning Brew - March 15th
Body: [Forwarded newsletter content]
```

### Forward an Article URL
```
To: your-processing-email@gmail.com  
Subject: Interesting AI Article
Body: Check this out: https://example.com/ai-breakthrough-2024
```

### Forward from Mobile
1. Open newsletter/article in email app
2. Tap "Forward"
3. Send to your processing email
4. System automatically processes and sends to Kindle

## Monitoring and Maintenance

### Health Checks
```bash
curl https://your-app.ondigitalocean.app/api/v1/health
```

### View Processed Articles
```bash
curl https://your-app.ondigitalocean.app/api/v1/articles/
```

### Logs and Debugging
- DigitalOcean provides log viewing in the dashboard
- Check Celery worker logs for background task status
- Monitor email processing frequency (every 5 minutes by default)

## Costs Breakdown

### DigitalOcean Example
- App Platform: $12/month (basic plan)
- PostgreSQL: $15/month (basic managed database)
- Redis: $15/month (basic managed redis)
- **Total**: ~$42/month

### Budget Option
- Use smaller instances: ~$25/month total
- Self-managed Redis (included in app): ~$15/month total

## Security Considerations

1. **Email Credentials**: Use app passwords, not main passwords
2. **Database**: Managed databases include security patches
3. **API Access**: Consider adding authentication for production
4. **Network**: Most cloud providers include DDoS protection

## Scaling

The system is designed to handle:
- **Light usage**: 10-50 articles/day
- **Medium usage**: 100-500 articles/day  
- **Heavy usage**: 1000+ articles/day (may need larger instances)

Background tasks (Celery) handle processing, so the API remains responsive.

## Troubleshooting

### Common Issues

1. **Emails not processing**
   - Check SMTP/IMAP credentials
   - Verify Gmail app password
   - Check firewall/network access

2. **Articles not reaching Kindle**
   - Verify Kindle email address
   - Check approved senders list
   - Test manual email to Kindle

3. **Database connection issues**
   - Check DATABASE_URL environment variable
   - Verify managed database is running
   - Check connection limits

### Support

- Check application logs in cloud provider dashboard
- Test individual components with health endpoint
- Verify environment variables are set correctly