const { spawn } = require('child_process');
const path = require('path');

class FastMCPLauncher {
  constructor() {
    this.process = null;
    this.isRunning = false;
    this.port = 8001; // Different port from main server
  }

  async start() {
    if (this.isRunning) {
      console.log('FastMCP server already running');
      return;
    }

    console.log('Starting FastMCP server...');
    
    const scriptPath = path.join(__dirname, 'mcpFastMCP.py');
    
    // Start FastMCP Python server as subprocess
    this.process = spawn('python3', [scriptPath], {
      env: {
        ...process.env,
        PORT: this.port.toString()
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle output
    this.process.stdout.on('data', (data) => {
      console.log(`[FastMCP] ${data.toString().trim()}`);
    });

    this.process.stderr.on('data', (data) => {
      console.error(`[FastMCP Error] ${data.toString().trim()}`);
    });

    // Handle process events
    this.process.on('spawn', () => {
      console.log(`FastMCP server started on port ${this.port}`);
      this.isRunning = true;
    });

    this.process.on('error', (error) => {
      console.error('Failed to start FastMCP server:', error);
      this.isRunning = false;
    });

    this.process.on('exit', (code, signal) => {
      console.log(`FastMCP server exited with code ${code} and signal ${signal}`);
      this.isRunning = false;
    });

    // Wait a moment for startup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!this.isRunning) {
      throw new Error('FastMCP server failed to start');
    }
  }

  async stop() {
    if (this.process && this.isRunning) {
      console.log('Stopping FastMCP server...');
      this.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise(resolve => {
        this.process.on('exit', resolve);
        setTimeout(() => {
          if (this.isRunning) {
            this.process.kill('SIGKILL');
            resolve();
          }
        }, 5000);
      });
    }
  }

  getPort() {
    return this.port;
  }

  getBaseUrl() {
    return `http://localhost:${this.port}`;
  }

  isHealthy() {
    return this.isRunning;
  }
}

module.exports = FastMCPLauncher;