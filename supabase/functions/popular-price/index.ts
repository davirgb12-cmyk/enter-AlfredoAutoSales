const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_1bacf0cfd1ff");
    if (!AI_API_TOKEN) throw new Error("AI token não configurado");

    const { brand, model, year, km, fuel } = await req.json();

    if (!brand || !model || !year) {
      return new Response(JSON.stringify({ error: "Dados insuficientes do veículo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const kmFormatted = Number(km || 0).toLocaleString("pt-BR");

    const prompt = `Você é um especialista no mercado de carros usados no Brasil.

Estime a faixa de preço popular para o veículo abaixo — ou seja, o preço real que a maioria das pessoas pratica ao vender esse carro em plataformas como OLX, Webmotors, iCarros e Mercado Livre no Brasil.

Veículo: ${brand} ${model} ${year}
Quilometragem: ${kmFormatted} km
Combustível: ${fuel || "Flex"}

Considere:
- O preço popular é geralmente 5% a 20% abaixo da tabela FIPE
- Quilometragem alta reduz o valor
- Modelos populares brasileiros (Gol, Onix, HB20, etc.) têm mercado mais líquido
- Use valores em reais inteiros (sem centavos)

Retorne APENAS um objeto JSON válido, sem explicações, sem markdown, sem texto adicional:
{"popular_min": <inteiro>, "popular_max": <inteiro>}`;

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 80,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      throw new Error("Falha ao consultar a IA");
    }

    const aiResponse = await response.json();
    const text = (aiResponse.content?.[0]?.text ?? "").trim();
    console.log("AI response text:", text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("Could not parse JSON from:", text);
      throw new Error("Formato de resposta inválido");
    }

    const result = JSON.parse(jsonMatch[0]);

    if (typeof result.popular_min !== "number" || typeof result.popular_max !== "number") {
      throw new Error("Resposta incompleta da IA");
    }

    // Ensure min <= max and both are positive
    const popular_min = Math.max(0, Math.min(result.popular_min, result.popular_max));
    const popular_max = Math.max(result.popular_min, result.popular_max);

    return new Response(JSON.stringify({ popular_min, popular_max }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("popular-price error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
