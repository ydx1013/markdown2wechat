# n8n 部署与调优指南

## 📋 部署方式对比

### 1. **Docker 部署**（推荐）
```bash
# 基础部署
docker run -it --rm \n  --name n8n \n  -p 5678:5678 \n  -v ~/.n8n:/home/node/.n8n \n  n8nio/n8n

# 生产环境配置
docker run -d \n  --name n8n \n  -p 5678:5678 \n  -v n8n_data:/home/node/.n8n \n  -e N8N_PROTOCOL=https \n  -e N8N_HOST=your-domain.com \n  -e N8N_PORT=5678 \n  -e WEBHOOK_URL=https://your-domain.com/ \n  n8nio/n8n
```

### 2. **Docker Compose 部署**
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_PROTOCOL=https
      - N8N_HOST=your-domain.com
      - N8N_PORT=5678
      - WEBHOOK_URL=https://your-domain.com/
      - N8N_ENCRYPTION_KEY=your-encryption-key
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

### 3. **Kubernetes 部署**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n
spec:
  replicas: 2
  selector:
    matchLabels:
      app: n8n
  template:
    metadata:
      labels:
        app: n8n
    spec:
      containers:
      - name: n8n
        image: n8nio/n8n
        ports:
        - containerPort: 5678
        env:
        - name: N8N_PROTOCOL
          value: "https"
        - name: N8N_HOST
          value: "your-domain.com"
        volumeMounts:
        - name: n8n-data
          mountPath: /home/node/.n8n
      volumes:
      - name: n8n-data
        persistentVolumeClaim:
          claimName: n8n-pvc
```

## ⚡ 性能调优配置

### **环境变量优化**
```bash
# 内存与执行限制
NODE_OPTIONS="--max-old-space-size=2048"
EXECUTIONS_PROCESS=main
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168  # 保留7天数据

# 数据库配置（使用外部数据库提升性能）
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=your-postgres-host
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your-password

# 队列处理
QUEUE_BULL_REDIS_HOST=your-redis-host
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=your-redis-password
```

### **Nginx 反向代理配置**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

## 🔧 高级调优技巧

### **1. 数据库优化**
```sql
-- PostgreSQL 优化
ALTER DATABASE n8n SET maintenance_work_mem = '256MB';
ALTER DATABASE n8n SET work_mem = '32MB';
ALTER DATABASE n8n SET shared_buffers = '512MB';

-- 创建索引加速查询
CREATE INDEX idx_executions_created_at ON executions(createdAt);
CREATE INDEX idx_workflow_updated_at ON workflow_entity(updatedAt);
```

### **2. Redis 队列配置**
```javascript
// n8n 配置中使用 Redis 作为队列后端
export default {
  queue: {
    healthCheckActive: true,
    bull: {
      redis: {
        host: 'redis-host',
        port: 6379,
        password: 'your-password',
        db: 0,
        keyPrefix: 'n8n:'
      }
    }
  }
}
```

### **3. 执行策略优化**
```bash
# 并发控制
EXECUTIONS_PROCESS=main
EXECUTIONS_TIMEOUT=7200
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=72  # 保留3天数据
EXECUTIONS_DATA_PRUNE_TIMEOUT=3600

# 内存管理
N8N_METRICS=true
N8N_DIAGNOSTICS_ENABLED=true
```

## 📊 监控与维护

### **健康检查端点**
```
GET /healthz
GET /metrics  # 需要启用 N8N_METRICS=true
```

### **日志配置**
```bash
# 日志级别设置
N8N_LOG_LEVEL=info  # debug, info, warn, error
N8N_LOG_OUTPUT=console
N8N_DIAGNOSTICS_ENABLED=true

# 日志轮转（使用 Docker 时）
docker run ... \n  --log-opt max-size=10m \n  --log-opt max-file=3
```

### **备份策略**
```bash
# 数据库备份
pg_dump -h localhost -U n8n n8n > n8n_backup_$(date +%Y%m%d).sql

# 工作流备份
docker exec n8n tar -czf /tmp/n8n_backup.tar.gz /home/node/.n8n
docker cp n8n:/tmp/n8n_backup.tar.gz .
```

## 🚀 生产环境最佳实践

1. **使用外部数据库**：避免使用 SQLite，改用 PostgreSQL
2. **启用 HTTPS**：配置正确的 SSL 证书
3. **设置备份策略**：定期备份数据库和工作流
4. **监控资源使用**：设置内存和 CPU 限制
5. **配置适当的超时**：根据工作流复杂度调整
6. **启用执行数据清理**：避免数据库膨胀
7. **使用队列系统**：Redis 提升并发处理能力
8. **设置访问控制**：配置用户认证和权限

## 🔍 故障排除

### **常见问题解决**
```bash
# 检查服务状态
docker logs n8n --tail 100

# 检查数据库连接
docker exec n8n node -e "require('pg').Client"

# 重置管理员密码
docker exec n8n n8n user:reset --email=admin@example.com
```

### **性能问题排查**
1. 检查数据库连接数
2. 监控内存使用情况
3. 分析慢查询日志
4. 检查队列积压情况
5. 验证网络延迟

---

**提示**：部署前请根据实际需求调整配置参数，建议先在测试环境验证配置后再部署到生产环境。