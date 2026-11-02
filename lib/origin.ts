import type {NextRequest} from 'next/server';
export function sameOrigin(req:NextRequest){try{const origin=new URL(req.headers.get('origin')??'');return ['http:','https:'].includes(origin.protocol)&&origin.host===req.headers.get('host');}catch{return false;}}
