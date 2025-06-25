// real-http-interceptor.ts
const originalHttpsRequest = require('https').request;

// Patch immediately when this module is imported
require('https').request = function(options: any, callback?: any) {
  console.log('\n🔍 INTERCEPTED HTTPS REQUEST');
  console.log('Original hostname:', options.hostname || options.host);
  console.log('Original options headers:', options.headers || 'none');
  
  // Force both lowercase and uppercase host headers
  if (!options.headers) {
    options.headers = {};
  }
  
  const targetHost = options.hostname || options.host || 'your-questdb-domain.com';
  options.headers.host = targetHost;
  options.headers.Host = targetHost;  // Add capitalized version
  
  console.log('📤 FORCED HEADERS:', JSON.stringify(options.headers, null, 2));
  
  const req = originalHttpsRequest.call(this, options, callback);
  
  const originalEnd = req.end;
  req.end = function(...args: any[]) {
    console.log('📤 ACTUAL HEADERS BEING SENT:');
    console.log(JSON.stringify(req.getHeaders(), null, 2));
    return originalEnd.apply(this, args);
  };
  
  req.on('error', (err: any) => {
    console.error('❌ REQUEST ERROR:', err.message);
    console.error('Error code:', err.code);
  });
  
  return req;
};

console.log('✅ HTTP interceptor with Host capitalization loaded');

// Export something to make it a proper module
export {};