#!/bin/bash

# DigitalOcean Deployment Script for Article Monster
# This script deploys the Article Monster to DigitalOcean using Docker and Kubernetes

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="article-monster-cluster"
REGION="nyc1"
NODE_COUNT=3
NODE_SIZE="s-2vcpu-4gb"
REGISTRY_NAME="article-monster-registry"
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
    
    # Check if doctl is installed
    if ! command -v doctl &> /dev/null; then
        log_error "doctl is not installed. Please install it first:"
        echo "https://docs.digitalocean.com/reference/doctl/how-to/install/"
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
    
    # Check doctl authentication
    if ! doctl account get &> /dev/null; then
        log_error "doctl is not authenticated. Please run: doctl auth init"
        exit 1
    fi
    
    log_info "All prerequisites satisfied"
}

# Create container registry
create_registry() {
    log_step "Creating container registry..."
    
    if doctl registry get $REGISTRY_NAME &> /dev/null; then
        log_info "Registry $REGISTRY_NAME already exists"
    else
        doctl registry create $REGISTRY_NAME
        log_info "Registry $REGISTRY_NAME created"
    fi
    
    # Configure Docker to use the registry
    doctl registry login
}

# Build and push Docker image
build_and_push_image() {
    log_step "Building and pushing Docker image..."
    
    REGISTRY_URL=$(doctl registry get $REGISTRY_NAME --format URL --no-header)
    IMAGE_TAG="$REGISTRY_URL/$APP_NAME:$(date +%Y%m%d-%H%M%S)"
    
    # Build image
    docker build -f Dockerfile.prod -t $IMAGE_TAG .
    
    # Push image
    docker push $IMAGE_TAG
    
    log_info "Image pushed: $IMAGE_TAG"
    echo "export IMAGE_TAG=$IMAGE_TAG" > .env.deploy
}

# Create Kubernetes cluster
create_cluster() {
    log_step "Creating Kubernetes cluster..."
    
    if doctl kubernetes cluster get $CLUSTER_NAME &> /dev/null; then
        log_info "Cluster $CLUSTER_NAME already exists"
    else
        doctl kubernetes cluster create $CLUSTER_NAME \
            --region $REGION \
            --node-pool "name=worker-pool;size=$NODE_SIZE;count=$NODE_COUNT;auto-scale=true;min-nodes=1;max-nodes=5" \
            --wait
        
        log_info "Cluster $CLUSTER_NAME created"
    fi
    
    # Configure kubectl
    doctl kubernetes cluster kubeconfig save $CLUSTER_NAME
}

# Deploy application to Kubernetes
deploy_to_kubernetes() {
    log_step "Deploying application to Kubernetes..."
    
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
    
    # Deploy database
    kubectl apply -f k8s/postgresql.yaml
    kubectl apply -f k8s/redis.yaml
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n article-monster
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n article-monster
    
    # Deploy application
    kubectl apply -f k8s/application.yaml
    
    # Deploy monitoring
    kubectl apply -f k8s/monitoring.yaml
    
    # Wait for application to be ready
    log_info "Waiting for application to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/article-monster-app -n article-monster
    
    log_info "Application deployed successfully"
}

# Setup ingress and SSL
setup_ingress() {
    log_step "Setting up ingress and SSL..."
    
    # Install NGINX Ingress Controller
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/do/deploy.yaml
    
    # Wait for ingress controller
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    # Install cert-manager for SSL
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
    
    # Wait for cert-manager
    kubectl wait --namespace cert-manager \
        --for=condition=ready pod \
        --selector=app=cert-manager \
        --timeout=300s
    
    # Create ClusterIssuer for Let's Encrypt
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # Update this
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
    
    if [ -n "$DOMAIN" ]; then
        # Update ingress with your domain
        sed -i.bak "s/yourdomain.com/$DOMAIN/g" k8s/ingress.yaml
        kubectl apply -f k8s/ingress.yaml
        
        log_info "Ingress configured for domain: $DOMAIN"
        log_info "Please update your DNS to point to the load balancer IP:"
        kubectl get svc -n ingress-nginx ingress-nginx-controller
    else
        log_warn "No domain specified. Skipping ingress setup."
        log_info "You can access the application via NodePort or LoadBalancer"
    fi
}

# Create load balancer
create_load_balancer() {
    log_step "Creating load balancer..."
    
    # Create a simple load balancer service
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: article-monster-lb
  namespace: article-monster
  annotations:
    service.beta.kubernetes.io/do-loadbalancer-name: "article-monster-lb"
    service.beta.kubernetes.io/do-loadbalancer-protocol: "http"
    service.beta.kubernetes.io/do-loadbalancer-healthcheck-path: "/health"
    service.beta.kubernetes.io/do-loadbalancer-healthcheck-protocol: "http"
spec:
  type: LoadBalancer
  selector:
    app: article-monster-app
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
EOF
    
    log_info "Load balancer created. Getting external IP..."
    
    # Wait for external IP
    external_ip=""
    while [ -z $external_ip ]; do
        echo "Waiting for external IP..."
        external_ip=$(kubectl get svc article-monster-lb -n article-monster --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
        [ -z "$external_ip" ] && sleep 10
    done
    
    log_info "External IP: $external_ip"
    echo "You can access your application at: http://$external_ip"
}

# Setup monitoring
setup_monitoring() {
    log_step "Setting up monitoring..."
    
    # Create monitoring namespace if it doesn't exist
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Add Prometheus Helm repository
    if command -v helm &> /dev/null; then
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
        helm repo update
        
        # Install Prometheus stack
        helm install prometheus prometheus-community/kube-prometheus-stack \
            --namespace monitoring \
            --set grafana.adminPassword=admin123 \
            --set prometheus.prometheusSpec.retention=30d
        
        log_info "Prometheus and Grafana installed via Helm"
    else
        log_info "Helm not found, using kubectl manifests"
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
    echo "  Nodes: $NODE_COUNT x $NODE_SIZE"
    echo ""
    
    echo "Services:"
    kubectl get svc -n article-monster
    echo ""
    
    echo "Pods:"
    kubectl get pods -n article-monster
    echo ""
    
    if [ -n "$DOMAIN" ]; then
        echo "Application URL: https://$DOMAIN"
    else
        external_ip=$(kubectl get svc article-monster-lb -n article-monster --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}" 2>/dev/null || echo "")
        if [ -n "$external_ip" ]; then
            echo "Application URL: http://$external_ip"
        fi
    fi
    
    echo ""
    echo "Monitoring:"
    echo "  Prometheus: kubectl port-forward svc/prometheus-service 9090:9090 -n article-monster"
    echo "  Grafana: kubectl port-forward svc/grafana-service 3000:3000 -n article-monster"
    echo ""
    
    echo "Useful commands:"
    echo "  View logs: kubectl logs -f deployment/article-monster-app -n article-monster"
    echo "  Scale app: kubectl scale deployment article-monster-app --replicas=3 -n article-monster"
    echo "  Delete cluster: doctl kubernetes cluster delete $CLUSTER_NAME"
}

# Main deployment function
main() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}    Article Monster - DigitalOcean Deployment${NC}"
    echo -e "${BLUE}================================================${NC}"
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
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --cluster-only    Only create cluster and registry"
                echo "  --app-only        Only deploy application (assumes cluster exists)"
                echo "  --domain DOMAIN   Set custom domain for ingress"
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
            create_registry
            create_cluster
            setup_ingress
            ;;
        "app")
            build_and_push_image
            deploy_to_kubernetes
            create_load_balancer
            ;;
        "full")
            create_registry
            build_and_push_image
            create_cluster
            deploy_to_kubernetes
            setup_ingress
            create_load_balancer
            setup_monitoring
            ;;
    esac
    
    show_deployment_info
    
    log_info "Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update DNS records if using custom domain"
    echo "2. Configure monitoring alerts"
    echo "3. Set up automated backups"
    echo "4. Review security settings"
}

# Run main function
main "$@"