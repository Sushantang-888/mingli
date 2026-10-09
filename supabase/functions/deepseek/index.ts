// DeepSeek 代理函数：前端不接触 DeepSeek key，key 存 Supabase 环境变量 DEEPSEEK_API_KEY
// 部署：supabase functions deploy deepseek --no-verify-jwt
// 设密钥：supabase secrets set DEEPSEEK_API_KEY=sk-xxx

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const key = Deno.env.get('DEEPSEEK_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: '服务端未配置 DEEPSEEK_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 直接转发前端的 DeepSeek payload（model + messages）
    const payload = await req.json();
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
