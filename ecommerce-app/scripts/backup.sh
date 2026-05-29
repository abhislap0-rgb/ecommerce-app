#!/bin/bash
# Automated backup script - runs nightly at 2 AM via cron
# cron: 0 2 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1

DATE=$(date +%Y-%m-%d)
DB_HOST="${DB_HOST}"
DB_USER="${DB_USER}"
DB_PASS="${DB_PASS}"
DB_NAME="ecommerce"
S3_BUCKET="s3://ecommerce-media-yourname/backups"

echo "Starting backup: $DATE"

# Backup database
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME \
  > /tmp/db-backup-$DATE.sql

# Compress it
gzip /tmp/db-backup-$DATE.sql

# Upload to S3
aws s3 cp /tmp/db-backup-$DATE.sql.gz $S3_BUCKET/db/
aws s3 sync /var/www/ecommerce/public/uploads $S3_BUCKET/media/

# Clean up local file
rm /tmp/db-backup-$DATE.sql.gz

echo "Backup completed: $DATE"
