// Gərəkli kitabxananı import edirik
import { GoogleGenerativeAI } from "@google/generative-ai";

// API açarınızı daxil edin. Təhlükəsizlik üçün bunu mühit dəyişənindən (environment variable) almaq tövsiyə olunur.
const genAI = new GoogleGenerativeAI("AIzaSyBzGw74mT0viHfBJ24sBK7cF7FE6sWTy1Y");

// Gemini üçün təyin etmək istədiyiniz sistem təlimatı
const systemPrompt = `
You are an AI that extracts product search keywords from natural language input specifically for fashion and clothing-related contexts. The goal is to help the user find fashion products on online shopping platforms like Amazon or Trendyol.

When the input is related to fashion or wearables (like clothing, accessories, shoes, etc), return this JSON:

{
  "status": "success",
  "content": "concise english product search string optimized for platforms like Amazon"
}

The 'content' must be:
- Written in English
- A realistic Amazon search query that could return relevant results
- Include specific clothing types, styles, gender (if inferable), and use-case (e.g., party, job interview)
- Do NOT translate user’s name or location. Only convert the intent into search keywords.

If the input is NOT about clothing or fashion, return:

{
  "status": "false",
  "content": "Not related to clothing or fashion"
}

You MUST return only valid JSON. No other text.
`;

// KlotoAI inputdan data alıb API-ə göndərir və nəticəni göstərir
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("klotoai-input");
  const sendBtn = document.getElementById("klotoai-send");
  const resultDiv = document.getElementById("klotoai-result");
  const form = document.getElementById("klotoai-form");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  async function handleQuery(e) {
    if (e) e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    resultDiv.textContent = "Yüklənir...";
    try {
      const result = await model.generateContent(query);
      const response = result.response;
      let text = response.text();
      try {
        const json = JSON.parse(text);
        if (json.status === "success") {
          resultDiv.textContent = json.content;
        } else {
          resultDiv.textContent = "Sorğu geyim və moda ilə bağlı deyil.";
        }
      } catch {
        resultDiv.textContent = text;
      }
    } catch (err) {
      resultDiv.textContent = "Xəta baş verdi: " + (err.message || err);
    }
  }

  sendBtn.addEventListener("click", handleQuery);
  form.addEventListener("submit", handleQuery);
});