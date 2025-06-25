const originalHttpsRequest = require('https').request;

require('https').request = function(options: any, callback?: any) {
  console.log('\n🔍 HTTPS REQUEST DEBUG');
  console.log('Target hostname:', options.hostname || options.host);
  console.log('Target port:', options.port || 443);
  
  const req = originalHttpsRequest.call(this, options, callback);
  
  // Log socket-level connection details
  req.on('socket', (socket: any) => {
    console.log('🔌 Socket created');
    
    socket.on('lookup', (err: any, address: string, family: string, host: string) => {
      if (err) {
        console.error('❌ DNS lookup failed:', err);
      } else {
        console.log(`✅ DNS lookup: ${host} -> ${address} (IPv${family})`);
      }
    });
    
    socket.on('connect', () => {
      console.log(`🤝 Socket connected to: ${socket.remoteAddress}:${socket.remotePort}`);
      console.log(`📍 Local socket: ${socket.localAddress}:${socket.localPort}`);
    });
    
    socket.on('error', (err: any) => {
      console.error(`🔌 Socket error: ${err.message}`);
    });
    
    socket.on('timeout', () => {
      console.error('🔌 Socket timeout');
    });
  });
  
  req.on('error', (err: any) => {
    console.error('❌ REQUEST ERROR:', err.message);
    console.error('Error details:', {
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      address: err.address,
      port: err.port
    });
  });
  
  return req;
};

export {};