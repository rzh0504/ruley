# Ruley
![ruley.png](https://s3.bmp.ovh/2026/05/26/jIyMqPM2.png)


一个用于解析订阅、整理节点规则并生成 `Mihomo` 配置的 Web 工具。

支持配置预览、云端托管订阅链接，以及基于 Postgres/Neon 的配置持久化。

## 功能

- 导入多种订阅输入：订阅链接、Base64 内容、YAML、节点 URI
- 解析常见协议：`vmess`、`vless`、`ss`、`ssr`、`trojan`、`hysteria`、`hysteria2`、`tuic`、`wireguard`、`snell`
- 生成 `Mihomo` 配置
- 自定义代理组、规则和高级 DNS
- 保存配置到本地数据库
- 生成可访问的订阅托管链接
- 支持云端订阅自动更新
- 支持配置分支管理

## Vercel 部署

1. 在 Neon 创建 Postgres 数据库并复制 `DATABASE_URL`
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 初始化数据库表结构

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
```

如果不想在本地或 CI 连接 Neon 执行迁移，也可以在 Neon 控制台手动执行 SQL。打开 Neon 项目的 SQL Editor，执行下面的初始化脚本：

```sql
CREATE TABLE IF NOT EXISTS "configs" (
  "id" serial PRIMARY KEY,
  "public_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "urls" text NOT NULL,
  "platform" text NOT NULL DEFAULT 'mihomo',
  "proxy_groups" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "rules" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "node_count" integer NOT NULL DEFAULT 0,
  "parsed_nodes" jsonb,
  "generated_config" text,
  "parent_id" integer REFERENCES "configs"("id") ON DELETE CASCADE,
  "cloud_token" text UNIQUE,
  "cloud_url" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
```

这段 SQL 适用于空的 Neon 数据库首次初始化。执行成功后，再把同一个 Neon 数据库的 `DATABASE_URL` 配置到 Vercel 环境变量即可。

Vercel 构建命令使用 `pnpm build`。

### Vercel 订阅自动更新

仓库内的 `vercel.json` 会配置 Vercel Cron，每天调用一次：

```txt
/api/internal/refresh-subscriptions
```

如果需要启用主动定时刷新，需要在 Vercel 环境变量中配置：

```txt
ENABLE_AUTOUPDATE=true
CRON_SECRET=your-cron-secret
```

Vercel Cron 调用时会携带 `Authorization: Bearer <CRON_SECRET>`，接口会使用该值鉴权。

如果 `ENABLE_AUTOUPDATE` 不是 `true`，主动定时刷新会保持禁用；订阅客户端访问云端订阅链接时仍会使用现有的懒刷新逻辑。

Vercel Hobby/Free 账户对 Cron 频率有限制，因此默认使用每日一次的计划任务。如果需要每 6 小时刷新一次，需要升级 Vercel 计划，或改用 Docker 部署中的 `subscription-refresher`。

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
| `ENABLE_AUTOUPDATE`       | 是否启用订阅主动定时刷新 | `false` |
| `CRON_SECRET`             | 订阅主动定时刷新接口鉴权密钥；启用主动刷新时必须设置 | 无 |
| `REFRESH_INTERVAL_SECONDS` | Docker 定时刷新间隔秒数 | `21600` |

## Docker 部署

`docker-compose.yml` 包含两个服务：

- `ruley`：Web 应用服务
- `subscription-refresher`：定时调用订阅刷新接口的轻量 sidecar

Docker 部署需要在 `.env` 中至少配置：

```txt
ADMIN_PASSWORD=your-password
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgres://user:password@host:5432/ruley
NEXT_PUBLIC_APP_URL=https://your-domain.example
ENABLE_AUTOUPDATE=true
CRON_SECRET=your-cron-secret
REFRESH_INTERVAL_SECONDS=21600
```

如果不需要主动定时刷新，可以保持 `ENABLE_AUTOUPDATE=false`，并且不设置 `CRON_SECRET`。此时 `subscription-refresher` 会保持空闲，不会调用刷新接口。

启动：

```bash
docker compose up -d
```

`subscription-refresher` 默认每 6 小时请求一次 `ruley` 容器内的 `/api/internal/refresh-subscriptions`，触发所有已发布云端订阅配置重新拉取上游订阅并更新缓存。即使定时刷新失败，订阅客户端访问云端订阅链接时仍会使用现有的懒刷新逻辑作为兜底。

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
