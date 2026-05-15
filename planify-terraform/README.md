# Planify – Staging Infrastructure (Terraform)

Replaces `staging-ecs-fargate.yaml` + `staging-rds-postgresql.yaml` with a single
Terraform project that is easier to reason about, avoids CloudFormation conditional
quirks, and wires the RDS secret into the DATABASE_URL automatically.

---

## Directory layout

```
planify-terraform/
├── main.tf                  # Module wiring
├── variables.tf             # All input variables
├── outputs.tf               # All outputs
├── versions.tf              # Provider pins
├── terraform.tfvars.example # Fill this in → copy to terraform.tfvars
└── modules/
    ├── ecr/       – ECR repositories (planify/backend, planify/frontend)
    ├── networking/– Security groups (ALB, ECS)
    ├── rds/       – PostgreSQL RDS + subnet group + RDS security group
    ├── secrets/   – DATABASE_URL + JWT secrets in Secrets Manager
    └── ecs/       – ALB, ECS cluster, task definition, Fargate service
```

---

## Pre-requisites

| Tool | Min version |
|------|------------|
| Terraform | 1.6+ |
| AWS CLI | v2 |
| AWS credentials | `AdministratorAccess` or fine-grained IAM |

```bash
brew install terraform        # macOS
# or: https://developer.hashicorp.com/terraform/install
```

---

## First deploy

### 1. Fill in your values

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars – at minimum set vpc_id, public_subnet_ids, database_subnet_ids
```

> **Tip – find your default VPC subnets:**
> ```bash
> aws ec2 describe-vpcs --filters Name=isDefault,Values=true \
>   --query 'Vpcs[0].VpcId' --output text
>
> aws ec2 describe-subnets \
>   --filters Name=vpcId,Values=<VPC_ID> Name=defaultForAz,Values=true \
>   --query 'Subnets[*].[SubnetId,AvailabilityZone]' --output table
> ```

### 2. Init + plan

```bash
terraform init
terraform plan
```

### 3. Apply

```bash
terraform apply
```

Terraform will create resources in this order:
1. ECR repos (if `create_ecr_repositories = true`)
2. Security groups
3. RDS instance (~5-10 min)
4. Secrets Manager secrets (DATABASE_URL built from RDS output)
5. ALB + ECS cluster + task definition + service

### 4. Copy outputs to GitHub Secrets

After apply finishes:

```bash
terraform output
```

| Terraform output | GitHub Secret |
|------------------|--------------|
| `ecs_cluster_name` | `ECS_CLUSTER_STAGING` |
| `ecs_service_name` | `ECS_SERVICE_STAGING` |
| `ecr_backend_repository_uri` | `ECR_BACKEND_URI` |
| `ecr_frontend_repository_uri` | `ECR_FRONTEND_URI` |

---

## CI/CD: pushing images

After the infrastructure is up, your GitHub Actions workflow should:

1. Authenticate: `aws ecr get-login-password | docker login ...`
2. Build + push `planify/backend:latest` and `planify/frontend:latest`
3. Force a new ECS deployment:
   ```bash
   aws ecs update-service \
     --cluster planify-staging \
     --service planify-staging-web \
     --force-new-deployment
   ```

The ECS service uses `lifecycle { ignore_changes = [task_definition] }` so Terraform
will not overwrite images pushed by CI.

---

## Common operations

### Force a new ECS deployment (after image push)
```bash
aws ecs update-service \
  --cluster planify-staging \
  --service planify-staging-web \
  --force-new-deployment
```

### View logs
```bash
aws logs tail /ecs/planify/staging/backend  --follow
aws logs tail /ecs/planify/staging/frontend --follow
```

### Destroy everything
```bash
terraform destroy
```
> RDS will create a final snapshot before deletion (see `final_snapshot_identifier`).

---

## Key differences from the CloudFormation version

| CloudFormation | Terraform |
|----------------|-----------|
| Two separate stacks, manual ARN copy-paste between them | Single project; modules wire together automatically |
| `{{resolve:secretsmanager:...}}` in `SecretString` can fail if secret isn't ready | `data` source reads the RDS secret at plan time; DATABASE_URL is a plain string |
| `CreateEcrRepositories` condition can cause `RepositoryAlreadyExistsException` | `count = var.create_ecr_repositories ? 1 : 0` is clean and idempotent |
| `DependsOn: ApplicationLoadBalancer` on TaskDefinition was unnecessary and fragile | Proper `depends_on = [aws_lb_listener.http]` on the service only |
| No `lifecycle` guard – every `terraform apply` would try to reset the image tag | `ignore_changes = [task_definition]` lets CI own image tags |
