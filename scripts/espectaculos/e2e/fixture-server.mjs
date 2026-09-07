import { createServer } from 'node:http';
const buyer='11111111-1111-4111-8111-111111111111',staff='22222222-2222-4222-8222-222222222222';
const orderId='33333333-3333-4333-8333-333333333333',ticketId='44444444-4444-4444-8444-444444444444',itemId='55555555-5555-4555-8555-555555555555';
const starts=new Date(Date.now()+86400000).toISOString();
let state;
function reset(){state={status:'reserved',paid:false,qrHash:null,used:false,lastRequest:null,role:'owner',checkinResult:null};}reset();
const event={id:1,nome:'Concerto E2E local',slug:'concerto-local',descricao:'Descrição do espetáculo local.',inicio:starts,fim:null,freguesia_id:1,lugar:'Sala local',entidade_organizadora_id:1,tipo:'cultural',estado:'publicado'};
const session={id:1,evento_id:1,starts_at:starts,ends_at:null,capacity:10,status:'scheduled',sales_enabled:true};
const type={id:1,ticket_type_id:1,session_id:1,name:'Geral',price_cents:0,currency:'EUR',quantity:10,active:true,max_per_order:2,available:10,sales_open:true};
function order(){return {id:orderId,buyer_id:buyer,session_id:1,entidade_id:1,status:state.status,total_cents:0,subtotal_cents:0,expires_at:new Date(Date.now()+600000).toISOString(),financial_review_required:state.status==='review',purchase_snapshot:{event_name:event.nome,session_starts_at:starts,place:'Sala local'},created_at:new Date().toISOString()};}
createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4319');let body='';for await(const part of req)body+=part;
 const p=body?JSON.parse(body):{};
 function send(data,status=200){res.writeHead(status,{'Content-Type':'application/json','Content-Range':'0-0/1','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
 if(url.pathname==='/__fixture/reset'){reset();return send({ok:true});}
 if(url.pathname==='/__fixture/state'){Object.assign(state,p);return send({ok:true});}
 let sub=null;try{sub=JSON.parse(Buffer.from((req.headers.authorization??'').split('.')[1],'base64url').toString()).sub;}catch{}
 if(url.pathname==='/auth/v1/user')return sub?send({id:sub,email:'local@example.invalid',email_confirmed_at:starts,app_metadata:{provider:'email'},user_metadata:{},factors:[]}):send({message:'No session'},401);
 const table=url.pathname.split('/').pop();
 if(url.pathname.includes('/rpc/')){
  if(table==='event_upcoming')return send([event]);
  if(table==='event_public_detail')return send({id:1,name:event.nome,description:event.descricao,place:event.lugar,organizer:'Organização local',status:'publicado',sessions:[{...session,place:'Sala local'}]});
  if(['event_public_availability','event_availability'].includes(table))return send([type]);
  if(table==='event_reserve'){if(!sub)return send({message:'unauthorized'},401);return send(orderId);}
  if(table==='event_confirm_free'){state.status='paid';state.paid=true;return send(null);}
  if(table==='event_set_ticket_hash'){state.qrHash=p.p_hash;return send(null);}
  if(table==='event_checkin_feedback'){
   if(sub!==staff)return send({message:'denied'},403);
   if(state.checkinResult)return send({result:state.checkinResult});
   if(p.p_hash!==state.qrHash)return send({result:'invalid'});
   if(state.used)return send({result:state.lastRequest===p.p_request?'accepted':'already_used',replayed:state.lastRequest===p.p_request});
   state.used=true;state.lastRequest=p.p_request;return send({result:'accepted',replayed:false});
  }
  if(table==='event_sales_summary')return send([{session_id:1,starts_at:starts,sold:1,reserved:0,available:9,...(state.role==='manager'?{}:{gross_cents:0,refunds_cents:0,net_before_provider_cents:0})}]);
  if(table==='event_operational_summary')return ['owner','admin','finance'].includes(state.role)?send([{session_id:1,starts_at:starts,status:'scheduled',review_orders:1,pending_payments:0,pending_refunds:0,failed_notifications:0,deferred_notifications:1}]):send({message:'denied'},403);
  return send({message:'Unexpected fixture RPC'},400);
 }
 let rows=[];
 if(table==='profiles')rows=[{id:sub,role:'user',mfa_setup_dismissed_at:starts}];
 if(table==='eventos')rows=[event];
 if(table==='entidades')rows=[{id:1,nome:'Organização local'}];
 if(table==='freguesias')rows=[{id:1,nome:'Local',municipio:'Teste'}];
 if(table==='event_sessions')rows=[session];
 if(table==='event_ticket_types')rows=[type];
 if(table==='event_organization_members')rows=sub===staff?[{role:state.role,entidade_id:1,user_id:staff}]:[];
 if(table==='event_orders')rows=sub===buyer||sub===staff?[order()]:[];
 if(table==='event_order_items')rows=[{id:itemId,order_id:orderId,name:'Geral',quantity:1,unit_price_cents:0}];
 if(table==='event_tickets')rows=state.paid?[{id:ticketId,order_item_id:itemId,key_version:1,status:state.used?'used':'valid',checked_in_at:state.used?starts:null}]:[];
 if(table==='event_payments'||table==='event_refunds')rows=[];
 // Minimal PostgREST equality filtering for IDOR scenarios.
 for(const [key,value] of url.searchParams){if(value.startsWith('eq.'))rows=rows.filter(r=>String(r[key])===value.slice(3));}
 if((req.headers.accept??'').includes('vnd.pgrst.object'))return rows.length===1?send(rows[0]):send({code:'PGRST116',details:'0 rows'},406);
 return send(rows);
}).listen(4319,'127.0.0.1');
