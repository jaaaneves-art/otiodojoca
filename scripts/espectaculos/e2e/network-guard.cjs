// Test process only: forbid outbound network even if a fixture misses a service call.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- script CommonJS (.cjs) de propósito, corre fora do bundle Next.
const net=require('node:net');
const original=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){
 const first=args[0];
 const opt=Array.isArray(first)?first[0]:first;
 const host=typeof opt==='object'&&opt!==null?opt.host:typeof args[1]==='string'?args[1]:undefined;
 if(host&&!['127.0.0.1','localhost','::1'].includes(host))throw new Error('E2E external network denied');
 return original.apply(this,args);
};
const fetchOriginal=globalThis.fetch;
if(fetchOriginal)globalThis.fetch=function(input,options){const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return Promise.reject(new Error('E2E external fetch denied'));return fetchOriginal(input,options);};
