# Ruley
<img width="1921" height="1081" alt="image" src="https://github.com/user-attachments/assets/59624f88-cdab-4f90-bd12-5e483e9dab96" />


一个用于解析订阅、整理节点规则并生成 `Mihomo` 配置的 Web 工具。

支持配置预览、云端托管订阅链接，以及基于 Postgres/Neon 的配置持久化。

## 功能

- 导入多种订阅输入：订阅链接、Base64 内容、YAML、节点 URI
- 解析常见协议：`vmess`、`vless`、`ss`、`ssr`、`trojan`、`hysteria`、`hysteria2`、`tuic`、`wireguard`、`snell`
- 生成 `Mihomo` 配置
- 自定义代理组、规则和高级 DNS
- 保存配置到本地数据库
- 生成可访问的订阅托管链接
- 支持配置分支管理

## Vercel 部署

1. 在 Neon 创建 Postgres 数据库并复制 `DATABASE_URL`
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 本地或 CI 执行数据库迁移

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
```

Vercel 构建命令使用 `pnpm build`。

## 环境变量

| 变量                      | 说明                | 默认值       |
| ------------------------- | ------------------- | ------------ |
| `ADMIN_PASSWORD`          | 后台登录密码        | 无，必须设置 |
| `JWT_SECRET`              | JWT 签名密钥        | 无，必须设置 |
| `DATABASE_URL`            | Postgres/Neon 连接字符串 | 无，必须设置 |
| `NEXT_PUBLIC_APP_URL`     | 生成公开订阅链接时使用的外部访问地址 | 自动从 Vercel/请求推断 |
| `ALLOW_HTTP_SUBSCRIPTIONS` | 是否允许抓取非 HTTPS 订阅链接 | `false` |
| `MAX_SUBSCRIPTION_URLS`   | 单次解析允许的订阅 URL 数量上限 | `10` |
| `MAX_SUBSCRIPTION_BYTES`  | 单个订阅响应体大小上限 | `5242880` |
| `SUBSCRIPTION_TIMEOUT_MS` | 单个订阅请求超时时间 | `15000` |
| `SUBSCRIPTION_CONCURRENCY` | 订阅抓取并发数 | `4` |
| `SUBSCRIPTION_CACHE_TTL_MS` | 云端订阅生成缓存有效期，刷新失败时会回退到上一次成功生成的 YAML | `300000` |

## 本地开发

如果本机已经安装 PostgreSQL 二进制文件，可以直接使用本地服务，不需要 Docker。

1. 启动本机 PostgreSQL 服务。

如果你已经通过安装包、Homebrew、Scoop、系统服务等方式启动了 PostgreSQL，只需要确认监听在 `localhost:5432`。

2. 创建本地数据库。

```bash
createdb -U postgres ruley
```

如果数据库已经存在，可以跳过这一步。

3. 配置 `.env.local`。

```txt
ADMIN_PASSWORD=your-local-password
JWT_SECRET=your-local-jwt-secret
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ruley
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

如果你的本机 PostgreSQL 用户、密码或端口不同，按实际值修改 `DATABASE_URL`。

4. 安装依赖、迁移数据库并启动开发服务。

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

本地默认数据库连接示例：

```txt
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ruley
```

### 本地 Docker 数据库（可选）

如果你没有安装 PostgreSQL，也可以使用仓库内的 compose 文件启动一个测试库：

```bash
docker compose -f docker-compose.db.yml up -d
pnpm db:migrate
pnpm dev
```

如果你想直接使用 Neon 做本地测试，也可以把 `.env` / `.env.local` 中的 `DATABASE_URL` 换成 Neon 的 development branch 连接字符串，然后执行：

```bash
pnpm db:migrate
pnpm dev
```
