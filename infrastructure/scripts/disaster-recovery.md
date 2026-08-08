# SkillDNA AI Disaster Recovery & Business Continuity Plan

## Target RTO / RPO
* **RTO (Recovery Time Objective)**: < 15 minutes
* **RPO (Recovery Point Objective)**: < 5 minutes (WAL replication)

## Recovery Procedures
1. Promote Read-Replica PostgreSQL to Primary.
2. Update DNS A-records to backup Kubernetes Cluster via Cloudflare.
3. Relaunch Redis background workers.
