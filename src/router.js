#!/usr/bin/env node

/**
 * Smart Router for Article Monster
 * Routes /sse to FastMCP (for ChatGPT MCP)
 * Routes everything else to Node.js (for website/bookmarklet)
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Service ports
const FASTMCP_PORT = 8001;
const NODEJS_PORT = 8002;

let fastmcpProcess = null;
let nodejsProcess = null;

// Start FastMCP Python server
function startFastMCP() {
    console.log(`[Router] Starting FastMCP on port ${FASTMCP_PORT}...`);
    
    const env = { ...process.env };
    env.PORT = FASTMCP_PORT;
    
    fastmcpProcess = spawn('python3', ['src/mcpFastMCP.py'], {
        env,
        stdio: ['inherit', 'pipe', 'pipe']
    });
    
    fastmcpProcess.stdout.on('data', (data) => {
        console.log(`[FastMCP] ${data.toString().trim()}`);
    });
    
    fastmcpProcess.stderr.on('data', (data) => {
        console.error(`[FastMCP Error] ${data.toString().trim()}`);
    });
    
    fastmcpProcess.on('error', (err) => {
        console.error('[Router] Failed to start FastMCP:', err);
    });
    
    fastmcpProcess.on('exit', (code) => {
        console.log(`[Router] FastMCP exited with code ${code}`);
        if (code !== 0) {
            console.log('[Router] FastMCP failed, but continuing with Node.js only');
        }
    });
}

// Start Node.js server
function startNodeJS() {
    console.log(`[Router] Starting Node.js server on port ${NODEJS_PORT}...`);
    
    const env = { ...process.env };
    env.PORT = NODEJS_PORT;
    env.FASTMCP_PORT = FASTMCP_PORT; // Let Node.js know where FastMCP is
    
    nodejsProcess = spawn('node', ['src/server.js'], {
        env,
        stdio: ['inherit', 'pipe', 'pipe']
    });
    
    nodejsProcess.stdout.on('data', (data) => {
        console.log(`[Node.js] ${data.toString().trim()}`);
    });
    
    nodejsProcess.stderr.on('data', (data) => {
        console.error(`[Node.js Error] ${data.toString().trim()}`);
    });
    
    nodejsProcess.on('error', (err) => {
        console.error('[Router] Failed to start Node.js:', err);
    });
    
    nodejsProcess.on('exit', (code) => {
        console.log(`[Router] Node.js exited with code ${code}`);
    });
}

// Graceful shutdown
function cleanup() {
    console.log('[Router] Shutting down services...');
    
    if (fastmcpProcess) {
        fastmcpProcess.kill('SIGTERM');
    }
    
    if (nodejsProcess) {
        nodejsProcess.kill('SIGTERM');
    }
    
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start both services
startFastMCP();
startNodeJS();

// Give services time to start
setTimeout(() => {
    console.log('[Router] Services should be ready, starting router...');
    
    // Route /sse to FastMCP (for ChatGPT)
    app.use('/sse', createProxyMiddleware({
        target: `http://localhost:${FASTMCP_PORT}`,
        changeOrigin: true,
        ws: false,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Router] Routing to FastMCP: ${req.method} ${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('[Router] FastMCP proxy error:', err);
            res.status(502).send('FastMCP service unavailable');
        }
    }));
    
    // Route everything else to Node.js (for website/bookmarklet)
    app.use('/', createProxyMiddleware({
        target: `http://localhost:${NODEJS_PORT}`,
        changeOrigin: true,
        ws: true,
        onProxyReq: (proxyReq, req, res) => {
            // Only log non-static requests
            if (!req.url.includes('.') || req.url.includes('.html')) {
                console.log(`[Router] Routing to Node.js: ${req.method} ${req.url}`);
            }
        },
        onError: (err, req, res) => {
            console.error('[Router] Node.js proxy error:', err);
            res.status(502).send('Node.js service unavailable');
        }
    }));
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Router] Smart router listening on port ${PORT}`);
        console.log(`[Router] /sse → FastMCP (port ${FASTMCP_PORT}) for ChatGPT MCP`);
        console.log(`[Router] /* → Node.js (port ${NODEJS_PORT}) for website/bookmarklet`);
    });
}, 3000);