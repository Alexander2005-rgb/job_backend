# Backend Vercel Deployment Fixes

## Issues Identified

- Socket.IO incompatible with Vercel serverless
- Hardcoded localhost URLs in OAuth
- CORS restricted to localhost
- Session cookie not secure for HTTPS
- Unnecessary dist/\*\* in vercel.json

## Tasks

- [x] Remove Socket.IO from server.js
- [x] Update CORS to use FRONTEND_URL env var
- [x] Set session cookie secure based on NODE_ENV
- [x] Update Google OAuth callback URL to use BASE_URL env var
- [x] Update OAuth redirect URLs to use FRONTEND_URL env var
- [x] Remove io.emit calls from applications.js
- [x] Remove includeFiles from vercel.json
- [x] Create .env.example with required variables
- [x] Update README with deployment instructions
