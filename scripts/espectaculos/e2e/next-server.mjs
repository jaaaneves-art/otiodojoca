import next from 'next';
import { createServer } from 'node:http';
import { mkdtempSync,symlinkSync,copyFileSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
// Isolated project root: Next's development lock is per root, not just distDir.
// Source directories are shared via symlinks; config/generated files live in /tmp.
const root=process.cwd();const dir=mkdtempSync('/tmp/otj-espectaculos-e2e-');
for(const name of ['app','components','lib','public','content','node_modules'])symlinkSync(join(root,name),join(dir,name),'dir');
for(const name of ['package.json','tsconfig.json','next-env.d.ts','proxy.ts','postcss.config.js','tailwind.config.ts']){
 try{copyFileSync(join(root,name),join(dir,name));}catch(error){if(error.code!=='ENOENT')throw error;}
}
writeFileSync(join(dir,'next.config.js'),'module.exports={};');
const app=next({dev:true,dir,webpack:true});await app.prepare();const handler=app.getRequestHandler();
const server=createServer((req,res)=>handler(req,res));server.listen(4318,'127.0.0.1');
process.on('SIGTERM',()=>{server.close();void app.close().then(()=>process.exit(0));});
