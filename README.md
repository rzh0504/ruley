# Ruley

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
2. 下载docekr-compose.yml
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
| `PORT`                    | 服务端口            | `4000`       |
| `NODE_ENV`                | 运行环境            | `production` |
| `NODE_MAX_OLD_SPACE_SIZE` | Node 内存限制       | `256`        |
| `MEM_LIMIT`               | Docker 容器内存限制 | `512m`       |
