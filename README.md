# 🛒 Abhi E-Commerce App — DevSecOps Project

A secure, cloud-hosted e-commerce application built on AWS following DevSecOps best practices.

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MySQL (AWS RDS)
- **Frontend**: HTML + CSS + Vanilla JS
- **Cloud**: AWS (EC2, RDS, S3, ALB, CloudFront, CloudWatch)
- **Security**: Helmet.js, JWT, bcrypt, rate limiting, input validation
- **DevOps**: Docker, GitHub Actions CI/CD, PM2

## Features
- User registration and login (JWT + bcrypt)
- Product catalog with search and pagination
- Shopping cart and order placement
- Admin dashboard (users, products, orders, stats)
- Product image upload to S3
- CloudWatch monitoring and logging

## Security Implementations (Phase 5)
- Helmet.js security headers
- Rate limiting (100 req/15min general, 5 req/15min for login)
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization with express-validator)
- JWT authentication middleware
- Role-based access control (admin vs user)
- Failed login attempt logging

## Setup Locally

```bash
# Clone repo
git clone https://github.com/yourusername/ecommerce-app.git
cd ecommerce-app

# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env
nano .env

# Run database schema
mysql -h YOUR_RDS_HOST -u admin -p < src/models/schema.sql

# Start app
npm start
```

## Environment Variables Required
```
PORT, DB_HOST, DB_USER, DB_PASS, DB_NAME
JWT_SECRET, AWS_REGION, AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY, S3_BUCKET, APP_URL
```

## Deployment (EC2)
```bash
cd /var/www/ecommerce
git clone https://github.com/yourusername/ecommerce-app.git .
npm install --production
pm2 start src/app.js --name ecommerce-app
pm2 save && pm2 startup
```

## Access App
```
http://YOUR-ALB-URL.ap-south-1.elb.amazonaws.com
```

## Default Admin Login
```
Email: admin@ecommerce.com
Password: Admin@123
```
**Change this immediately after first login!**

## Architecture
```
Internet → ALB (port 80) → EC2 (Nginx → Node.js) → RDS MySQL
                                    ↓
                              S3 (images) → CloudFront
                                    ↓
                              CloudWatch (monitoring)
```
# pipeline test
