# Nakama Backend Deployment Guide for Render

## ✅ Problem Fixed: musl vs glibc Compatibility

**Previous Error:**
```
plugin.Open("/nakama/data/modules/main.so"): libc.musl-x86_64.so.1: cannot open shared object file
```

**Root Cause:** Plugin was built with Alpine Linux (musl) but Nakama runs on Debian (glibc).

**Solution:** Use `golang:1.22` (Debian-based) instead of `golang:1.21-alpine` for building the plugin.

---

## 🚀 Quick Deploy to Render

### 1. Environment Variables (Required)

Set these in Render → Your Service → Environment:

| Key | Value | Description |
|-----|-------|-------------|
| `NAKAMA_DATABASE_DSN` | `postgres://user:pass@host:port/dbname?sslmode=require` | Full PostgreSQL connection string |
| `SOCKET_SERVER_KEY` | `defaultkey` | Nakama socket server key (change in production!) |
| `PORT` | (auto-set by Render) | Server port (Render sets this automatically) |

**Example DSN:**
```
postgres://nakama_qtau_user:gP9Rn9XMVh2Obb4kz3F594d09tN5p4Lk@dpg-d46dtnur433s73ckl4kg-a.singapore-postgres.render.com:5432/nakama_qtau?sslmode=require
```

### 2. Render Service Configuration

- **Type:** Web Service
- **Dockerfile Path:** `backend/Dockerfile`
- **Docker Context:** `backend/`
- **Start Command:** (Leave empty - uses ENTRYPOINT from Dockerfile)

### 3. Build Settings

Render will automatically:
1. Build the plugin using `golang:1.22` (glibc-compatible)
2. Copy it to `/nakama/data/modules/main.so`
3. Start Nakama with proper environment variables

---

## 🔧 Local Development

### Build Plugin Locally (Optional)

**Windows (PowerShell):**
```powershell
cd backend
./build_module.ps1
```

**Linux/macOS:**
```bash
cd backend
bash build_module.sh
```

This creates `backend/module.so` (glibc-compatible).

### Test Docker Build Locally

```bash
cd backend
docker build -t nakama-backend .
docker run -e NAKAMA_DATABASE_DSN="postgres://..." -e SOCKET_SERVER_KEY="defaultkey" -p 7350:7350 nakama-backend
```

---

## 📋 Verification Checklist

After deployment, check Render logs for:

✅ **Success Indicators:**
```
{"msg":"Running database migrations..."}
{"msg":"Starting Nakama server..."}
{"msg":"Nakama module loaded: main.so"}
{"msg":"Database connection established successfully"}
{"msg":"Server listening on 0.0.0.0:7350"}
```

❌ **Error Indicators:**
- `libc.musl-x86_64.so.1` → Plugin built with wrong libc (should be fixed now)
- `failed to connect` → Check `NAKAMA_DATABASE_DSN`
- `plugin.Open failed` → Plugin not found or wrong architecture

---

## 🐛 Troubleshooting

### Issue: "plugin.Open failed"

**Solution:** Ensure Dockerfile uses `golang:1.22` (not Alpine) for plugin builder stage.

### Issue: "Database connection failed"

**Solution:** 
1. Verify `NAKAMA_DATABASE_DSN` is set correctly
2. Use external connection URL (`.render.com` hostname)
3. Include `?sslmode=require` for Render Postgres

### Issue: "Timed Out"

**Solution:**
1. Check that `PORT` environment variable is set (Render sets this automatically)
2. Verify health check endpoint responds: `curl http://localhost:7350/`
3. Check database connection isn't blocking startup

---

## 📁 File Structure

```
backend/
├── Dockerfile              ← Main deployment Dockerfile (multi-stage)
├── build-plugin.Dockerfile ← Standalone plugin builder (optional)
├── predeploy_check.sh      ← Pre-deployment validation script
├── build_module.sh         ← Local build script (Linux/macOS)
├── build_module.ps1        ← Local build script (Windows)
├── config/
│   └── nakama-config.yml   ← Nakama configuration
├── data/
│   └── schema.sql          ← Database schema
└── modules/
    ├── init.go             ← Module initialization
    ├── main.go             ← RPC handlers
    └── tic_tac_toe.go      ← Game match logic
```

---

## 🔐 Security Notes

⚠️ **Change these in production:**
- `SOCKET_SERVER_KEY` → Use a strong random key
- `console.username` / `console.password` → Change default admin credentials
- `session.encryption_key` → Generate secure keys

---

## 📞 Support

If deployment still fails:
1. Check Render logs for exact error message
2. Verify all environment variables are set
3. Ensure database is accessible from Render's network
4. Confirm Dockerfile builds successfully locally

---

**Last Updated:** 2025-11-06
**Nakama Version:** 3.21.0
**Go Version:** 1.22

