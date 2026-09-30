import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({limit:"128kb"}));

const PORT = process.env.PORT || 3000;
const MODEL = process.env.MODEL || "gpt-5.6-luna";

app.get("/health", (_, res) => res.json({ok:true, service:"JARVIS 3.0"}));

app.post("/chat", async (req,res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({error:"OPENAI_API_KEY não configurada no backend."});
    }

    const {message, memory=[]} = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({error:"message é obrigatório."});
    }

    const memoryText = Array.isArray(memory)
      ? memory.slice(-30).join("\n")
      : "";

    const input = [
      {
        role: "system",
        content:
          "Você é JARVIS, um assistente pessoal em português do Brasil. " +
          "Responda de forma clara, útil e objetiva. Nunca alegue ter executado " +
          "uma ação no telefone quando ela não foi confirmada pelo aplicativo. " +
          "Memórias locais do usuário:\n" + memoryText
      },
      { role:"user", content:message }
    ];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
      },
      body:JSON.stringify({model:MODEL, input})
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({error:data});

    const output = (data.output_text || "").trim();
    res.json({reply: output || "Não recebi uma resposta textual do modelo."});
  } catch (e) {
    res.status(500).json({error:String(e.message || e)});
  }
});

app.listen(PORT, ()=>console.log(`JARVIS backend ativo na porta ${PORT}`));
