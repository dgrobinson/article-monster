#!/bin/bash

# AWS Deployment Script for Article Monster
# This script deploys the Article Monster to AWS using EKS

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="article-monster-cluster"
REGION="us-east-1"
NODE_GROUP_NAME="article-monster-nodes"
NODE_TYPE="t3.medium"
NODE_COUNT=3
ECR_REPO_NAME="article-monster"
APP_NAME="article-monster"
DOMAIN=""  # Set your domain here

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first:"
        echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check if eksctl is installed
    if ! command -v eksctl &> /dev/null; then
        log_error "eksctl is not installed. Please install it first:"
        echo "https://docs.aws.amazon.com/eks/latest/userguide/eksctl.html"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first:"
        echo "https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed. Please install it first"
        exit 1
    fi
    
    # Check AWS configuration
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured. Please run: aws configure"
        exit 1
    fi
    
    log_info "All prerequisites satisfied"
}

# Create ECR repository
create_ecr_repository() {
    log_step "Creating ECR repository..."
    
    if aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $REGION &> /dev/null; then
        log_info "ECR repository $ECR_REPO_NAME already exists"
    else
        aws ecr create-repository \
            --repository-name $ECR_REPO_NAME \
            --region $REGION \
            --image-scanning-configuration scanOnPush=true
        
        log_info "ECR repository $ECR_REPO_NAME created"
    fi
    
    # Get login token for Docker
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com
}

# Build and push Docker image
build_and_push_image() {
    log_step "Building and pushing Docker image..."
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME"
    IMAGE_TAG="$ECR_URI:$(date +%Y%m%d-%H%M%S)"
    
    # Build image
    docker build -f Dockerfile.prod -t $IMAGE_TAG .
    docker tag $IMAGE_TAG $ECR_URI:latest
    
    # Push image
    docker push $IMAGE_TAG
    docker push $ECR_URI:latest
    
    log_info "Images pushed to ECR: $IMAGE_TAG"
    echo "export IMAGE_TAG=$IMAGE_TAG" > .env.deploy
    echo "export ECR_URI=$ECR_URI" >> .env.deploy
}

# Create EKS cluster
create_eks_cluster() {
    log_step "Creating EKS cluster..."
    
    if eksctl get cluster --name $CLUSTER_NAME --region $REGION &> /dev/null; then
        log_info "Cluster $CLUSTER_NAME already exists"
    else
        # Create cluster configuration
        cat <<EOF > cluster-config.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: $CLUSTER_NAME
  region: $REGION
  version: "1.27"

availabilityZones: ["${REGION}a", "${REGION}b", "${REGION}c"]

managedNodeGroups:
  - name: $NODE_GROUP_NAME
    instanceType: $NODE_TYPE
    desiredCapacity: $NODE_COUNT
    minSize: 1
    maxSize: 6
    volumeSize: 30
    volumeType: gp3
    ssh:
      allow: false
    iam:
      withAddonPolicies:
        autoScaler: true
        cloudWatch: true
        ebs: true
        efs: true
        albIngress: true
    labels:
      nodegroup-type: $NODE_GROUP_NAME
      environment: production
    tags:
      Environment: production
      Application: article-monster

cloudWatch:
  clusterLogging:
    enable: ["audit", "authenticator", "controllerManager"]

addons:
- name: vpc-cni
  version: latest
- name: coredns
  version: latest
- name: kube-proxy
  version: latest
- name: aws-ebs-csi-driver
  version: latest

iam:
  withOIDC: true
  serviceAccounts:
  - metadata:
      name: aws-load-balancer-controller
      namespace: kube-system
    wellKnownPolicies:
      awsLoadBalancerController: true
  - metadata:
      name: ebs-csi-controller-sa
      namespace: kube-system
    wellKnownPolicies:
      ebsCSIController: true
  - metadata:
      name: cluster-autoscaler
      namespace: kube-system
    wellKnownPolicies:
      autoScaler: true
EOF
        
        eksctl create cluster -f cluster-config.yaml
        log_info "EKS cluster $CLUSTER_NAME created"
    fi
    
    # Update kubeconfig
    aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME
}

# Install AWS Load Balancer Controller
install_alb_controller() {
    log_step "Installing AWS Load Balancer Controller..."
    
    # Download IAM policy
    curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json
    
    # Create IAM policy
    POLICY_ARN=$(aws iam create-policy \
        --policy-name AWSLoadBalancerControllerIAMPolicy \
        --policy-document file://iam_policy.json \
        --query 'Policy.Arn' \
        --output text 2>/dev/null || \
        aws iam list-policies --query 'Policies[?PolicyName==`AWSLoadBalancerControllerIAMPolicy`].Arn' --output text)
    
    # Create service account
    eksctl create iamserviceaccount \
        --cluster=$CLUSTER_NAME \
        --namespace=kube-system \
        --name=aws-load-balancer-controller \
        --role-name AmazonEKSLoadBalancerControllerRole \
        --attach-policy-arn=$POLICY_ARN \
        --override-existing-serviceaccounts \
        --region $REGION \
        --approve
    
    # Add EKS Helm repository
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    # Install AWS Load Balancer Controller
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName=$CLUSTER_NAME \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller \
        --set region=$REGION \
        --set vpcId=$(aws eks describe-cluster --name $CLUSTER_NAME --query "cluster.resourcesVpcConfig.vpcId" --output text --region $REGION)
    
    rm -f iam_policy.json
    log_info "AWS Load Balancer Controller installed"
}

# Deploy application to EKS
deploy_to_eks() {
    log_step "Deploying application to EKS..."
    
    # Source the image tag
    source .env.deploy
    
    # Create namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Generate secrets
    log_info "Please update the secrets in k8s/secrets.yaml with actual values"
    read -p "Have you updated the secrets? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Please update secrets before continuing"
        exit 1
    fi
    
    # Apply secrets and config
    kubectl apply -f k8s/secrets.yaml
    
    # Update image in deployment files
    sed -i.bak "s|image: article-monster:latest|image: $IMAGE_TAG|g" k8s/application.yaml
    
    # Create storage class for EBS
    cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
EOF
    
    # Update storage class in PVCs
    sed -i.bak 's/storageClassName: standard/storageClassName: ebs-gp3/g' k8s/postgresql.yaml
    sed -i.bak 's/storageClassName: standard/storageClassName: ebs-gp3/g' k8s/redis.yaml
    sed -i.bak 's/storageClassName: standard/storageClassName: ebs-gp3/g' k8s/application.yaml
    sed -i.bak 's/storageClassName: standard/storageClassName: ebs-gp3/g' k8s/monitoring.yaml
    
    # Deploy database
    kubectl apply -f k8s/postgresql.yaml
    kubectl apply -f k8s/redis.yaml
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n article-monster
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n article-monster
    
    # Deploy application
    kubectl apply -f k8s/application.yaml
    
    # Wait for application to be ready
    log_info "Waiting for application to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/article-monster-app -n article-monster
    
    log_info "Application deployed successfully"
}

# Setup ALB Ingress
setup_alb_ingress() {
    log_step "Setting up ALB Ingress..."
    
    # Create ALB Ingress
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: article-monster-alb
  namespace: article-monster
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:$REGION:$(aws sts get-caller-identity --query Account --output text):certificate/YOUR_CERTIFICATE_ARN
spec:
  rules:
  - host: ${DOMAIN:-example.com}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: article-monster-service
            port:
              number: 8000
EOF
    
    if [ -n "$DOMAIN" ]; then
        log_info "ALB Ingress configured for domain: $DOMAIN"
        log_info "Please ensure you have an SSL certificate in ACM for your domain"
    else
        log_warn "No domain specified. Update the ingress manually with your domain and certificate ARN"
    fi
}

# Setup monitoring with Amazon Managed Prometheus and Grafana
setup_managed_monitoring() {
    log_step "Setting up Amazon Managed Prometheus and Grafana..."
    
    # Create AMP workspace
    WORKSPACE_ID=$(aws amp create-workspace \
        --alias article-monster-prometheus \
        --region $REGION \
        --query 'workspaceId' \
        --output text 2>/dev/null || \
        aws amp list-workspaces \
        --alias article-monster-prometheus \
        --region $REGION \
        --query 'workspaces[0].workspaceId' \
        --output text)
    
    if [ "$WORKSPACE_ID" != "None" ] && [ -n "$WORKSPACE_ID" ]; then
        log_info "AMP Workspace ID: $WORKSPACE_ID"
        
        # Create service account for Prometheus
        eksctl create iamserviceaccount \
            --name amp-iamproxy-ingest-service-account \
            --namespace prometheus \
            --cluster $CLUSTER_NAME \
            --region $REGION \
            --attach-policy-arn arn:aws:iam::aws:policy/AmazonPrometheusRemoteWriteAccess \
            --override-existing-serviceaccounts \
            --approve
        
        # Install Prometheus using Helm
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
        helm repo update
        
        kubectl create namespace prometheus --dry-run=client -o yaml | kubectl apply -f -
        
        cat <<EOF > prometheus-values.yaml
server:
  remoteWrite:
    - url: https://aps-workspaces.$REGION.amazonaws.com/workspaces/$WORKSPACE_ID/api/v1/remote_write
      sigv4:
        region: $REGION
      queue_config:
        max_samples_per_send: 1000
        max_shards: 200
        capacity: 2500
  serviceAccount:
    name: amp-iamproxy-ingest-service-account
    create: false
EOF
        
        helm install prometheus prometheus-community/prometheus \
            --namespace prometheus \
            --values prometheus-values.yaml
        
        log_info "Prometheus configured with AMP"
    else
        log_warn "Failed to create AMP workspace, using self-hosted Prometheus"
        kubectl apply -f k8s/monitoring.yaml
    fi
}

# Display deployment info
show_deployment_info() {
    log_step "Deployment Information"
    
    echo "=================================="
    echo "Cluster Information:"
    echo "  Name: $CLUSTER_NAME"
    echo "  Region: $REGION"
    echo "  Node Group: $NODE_GROUP_NAME"
    echo "  Instance Type: $NODE_TYPE"
    echo ""
    
    echo "Services:"
    kubectl get svc -n article-monster
    echo ""
    
    echo "Pods:"
    kubectl get pods -n article-monster
    echo ""
    
    echo "Ingress:"
    kubectl get ingress -n article-monster
    echo ""
    
    if [ -n "$DOMAIN" ]; then
        echo "Application URL: https://$DOMAIN"
    else
        ALB_DNS=$(kubectl get ingress article-monster-alb -n article-monster -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        if [ -n "$ALB_DNS" ]; then
            echo "Application URL: http://$ALB_DNS"
        fi
    fi
    
    echo ""
    echo "AWS Resources:"
    echo "  EKS Cluster: $CLUSTER_NAME"
    echo "  ECR Repository: $ECR_REPO_NAME"
    echo "  Region: $REGION"
    echo ""
    
    echo "Useful commands:"
    echo "  View logs: kubectl logs -f deployment/article-monster-app -n article-monster"
    echo "  Scale app: kubectl scale deployment article-monster-app --replicas=3 -n article-monster"
    echo "  Delete cluster: eksctl delete cluster --name $CLUSTER_NAME --region $REGION"
}

# Main deployment function
main() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}    Article Monster - AWS EKS Deployment${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    
    # Parse command line arguments
    DEPLOY_TYPE="full"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --cluster-only)
                DEPLOY_TYPE="cluster"
                shift
                ;;
            --app-only)
                DEPLOY_TYPE="app"
                shift
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --cluster-only    Only create cluster and ECR"
                echo "  --app-only        Only deploy application (assumes cluster exists)"
                echo "  --domain DOMAIN   Set custom domain for ALB"
                echo "  --region REGION   AWS region (default: us-east-1)"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    check_prerequisites
    
    case $DEPLOY_TYPE in
        "cluster")
            create_ecr_repository
            create_eks_cluster
            install_alb_controller
            ;;
        "app")
            build_and_push_image
            deploy_to_eks
            setup_alb_ingress
            ;;
        "full")
            create_ecr_repository
            build_and_push_image
            create_eks_cluster
            install_alb_controller
            deploy_to_eks
            setup_alb_ingress
            setup_managed_monitoring
            ;;
    esac
    
    show_deployment_info
    
    log_info "Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure Route 53 for your domain (if using custom domain)"
    echo "2. Request SSL certificate in ACM and update ingress"
    echo "3. Set up CloudWatch alerts"
    echo "4. Configure automated backups to S3"
    echo "5. Review IAM policies and security groups"
}

# Run main function
main "$@"