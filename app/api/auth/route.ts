import {sameOrigin} from '@/lib/origin';
import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth';
export async function POST(req:NextRequest){if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});const body=await req.json();if(typeof body.email!=='string'||typeof body.password!=='string')return NextResponse.json({error:'請輸入帳號密碼'},{status:400});const client=await authClient();const {error}=await client.auth.signInWithPassword({email:body.email,password:body.password});return NextResponse.json(error?{error:'登入失敗'}:{ok:true},{status:error?401:200});}
