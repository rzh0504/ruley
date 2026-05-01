# Ruley
<img width="1921" height="1081" alt="image" src="https://github.com/user-attachments/assets/59624f88-cdab-4f90-bd12-5e483e9dab96" />


一个用于解析订阅、整理节点规则并生成 `Clash` / `Mihomo` 配置的 Web 工具。

支持本地管理、配置预览、云端托管订阅链接，以及基于 SQLite 的配置持久化。

## 功能

- 导入多种订阅输入：订阅链接、Base64 内容、YAML、节点 URI
- 解析常见协议：`vmess`、`vless`、`ss`、`ssr`、`trojan`、`hysteria`、`hysteria2`、`tuic`、`wireguard`、`snell`
- 生成 `Clash` / `Mihomo` 配置
- 自定义代理组、规则和高级 DNS
- 保存配置到本地数据库
- 生成可访问的订阅托管链接
- 支持配置分支管理

## Docker 部署

1. 配置 `.env`
2. 下载 [docekr-compose.yml](https://github.com/rzh0504/ruley/blob/main/docker-compose.yml)
3. 启动服务

```bash
docker compose up -d
```

默认访问地址：
`http://localhost:4000`

## 环境变量

| 变量                      | 说明                | 默认值       |
| ------------------------- | ------------------- | ------------ |
| `ADMIN_PASSWORD`          | 后台登录密码        | 无，必须设置 |
| `JWT_SECRET`              | JWT 签名密钥        | 无，必须设置 |
| `CORS_ORIGIN`             | 生产环境允许访问 API 的前端 Origin，多个用逗号分隔 | 空 |
| `PUBLIC_BASE_URL`         | 生成公开订阅链接时使用的外部访问地址 | 自动从请求推断 |
| `TRUST_PROXY`             | 位于反向代理后方时启用可信代理解析 | `false` |
| `ALLOW_HTTP_SUBSCRIPTIONS` | 是否允许抓取非 HTTPS 订阅链接 | `false` |
| `MAX_SUBSCRIPTION_URLS`   | 单次解析允许的订阅 URL 数量上限 | `10` |
| `MAX_SUBSCRIPTION_BYTES`  | 单个订阅响应体大小上限 | `5242880` |
| `SUBSCRIPTION_TIMEOUT_MS` | 单个订阅请求超时时间 | `15000` |
| `SUBSCRIPTION_CONCURRENCY` | 订阅抓取并发数 | `4` |
| `PORT`                    | 服务端口            | `4000`       |
| `NODE_ENV`                | 运行环境            | `production` |
| `NODE_MAX_OLD_SPACE_SIZE` | Node 内存限制       | `256`        |
| `MEM_LIMIT`               | Docker 容器内存限制 | `512m`       |
