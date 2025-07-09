const { spawn } = require('child_process');
const path = require('path');

// Start backend.py
const realDir = path.dirname(process.execPath);
const backend = spawn('python', [path.join(realDir, 'backend.py')], {
  stdio: 'inherit',
  cwd: realDir // Ensure backend.py runs in the real directory
});

// Start Electron app (npm start)
const frontend = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

if (process.argv.length > 2) {
  console.error('This executable does not accept arguments. Please run it without extra parameters.');
  process.exit(1);
}

// Optional: Clean up both on exit
process.on('SIGINT', () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
}); 