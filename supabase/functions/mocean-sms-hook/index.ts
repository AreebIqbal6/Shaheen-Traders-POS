import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const payload = await req.json()
    const { user, sms } = payload
    
    // We expect the user object and the sms.otp to be present.
    if (!user || !sms || !sms.otp) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    const phone = user.phone;
    const otp = sms.otp;
    
    // Your Mocean API Token (We will securely store this in Supabase Edge Secrets)
    const MOCEAN_API_TOKEN = Deno.env.get("MOCEAN_API_TOKEN");
    
    if (!MOCEAN_API_TOKEN) {
      console.error("MOCEAN_API_TOKEN secret is missing.");
      return new Response(JSON.stringify({ error: "Server Configuration Error" }), { status: 500 })
    }

    // Format the phone number (Mocean typically expects numbers without the leading '+')
    const formattedPhone = phone.startsWith('+') ? phone.slice(1) : phone;
    const textMessage = `Your Shaheen Traders verification code is: ${otp}`;

    console.log(`Sending OTP via Mocean to ${formattedPhone}...`);

    // Prepare x-www-form-urlencoded body for Mocean
    const formParams = new URLSearchParams();
    formParams.append("mocean-from", "SHAHEEN");
    formParams.append("mocean-to", formattedPhone);
    formParams.append("mocean-text", textMessage);

    const moceanRes = await fetch("https://rest.moceanapi.com/rest/2/sms", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MOCEAN_API_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formParams.toString()
    });

    const moceanData = await moceanRes.json();
    
    if (!moceanRes.ok) {
      console.error("Mocean API Error:", moceanData);
      return new Response(JSON.stringify({ error: "Failed to send SMS" }), { status: 500 });
    }

    console.log("Mocean API Success:", moceanData);
    
    // Respond back to Supabase Auth that we handled the SMS
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
