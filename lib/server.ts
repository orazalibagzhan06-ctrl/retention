import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export function database(){return env.DB}
export function files(){return env.FILES}
export async function identity(){const user=await getChatGPTUser(); if(!user)throw new Error('AUTH');return user}
export function fail(error:unknown){if(error instanceof Error&&error.message==='AUTH')return Response.json({error:'Сайтқа кіру қажет.'},{status:401}); console.error('Request failed',error instanceof Error?error.message:'unknown');return Response.json({error:'Сақтау сәтсіз аяқталды. Қайта көріңіз.'},{status:500})}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin}
export function field(value:unknown,max=2000){return typeof value==='string'?value.trim().slice(0,max):''}
export const entrySelect='SELECT id,kind,group_id AS groupId,title,reason,method,result,status,follow_up AS followUp,file_id AS fileId,file_name AS fileName,created,author,user_id AS userId FROM entries';
