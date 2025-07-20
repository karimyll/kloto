// KlotoAI - Fashion Search Engine
// API integrations and UI handlers

class KlotoAI {
    constructor() {
        this.geminiApiKey = "AIzaSyA9VqOM71EsOZQzpwCUjbJBrd5KFnNnu7I";
        this.amazonApiKey = "71f2bb0922msh4326ca52641e7e2p19b00ajsn14df33aa7f74";
        this.genAI = null;
        this.model = null;
        
        this.initializeElements();
        this.initializeGemini();
        this.bindEvents();
    }

    // Initialize DOM elements
    initializeElements() {
        this.input = document.getElementById("klotoai-input");
        this.sendBtn = document.getElementById("klotoai-send");
        this.resultDiv = document.getElementById("klotoai-result");
        this.form = document.getElementById("klotoai-form");
    }

    // Initialize Gemini AI
    async initializeGemini() {
        try {
            const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
            this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
            
            const systemPrompt = `You are an AI that extracts product search keywords from natural language input specifically for fashion and clothing-related contexts. The goal is to help the user find fashion products on online shopping platforms like Amazon or Trendyol.

When the input is related to fashion or wearables (like clothing, accessories, shoes, etc), return this JSON:

{
  "status": "success",
  "content": "concise english product search string optimized for platforms like Amazon"
}

The content must be:
- Written in English
- A realistic Amazon search query that could return relevant results
- Include specific clothing types, styles, gender (if inferable), and use-case (e.g., party, job interview)
- Do NOT translate user's name or location. Only convert the intent into search keywords.

If the input is NOT about clothing or fashion, return:

{
  "status": "false",
  "content": "Not related to clothing or fashion"
}

Examples:

Input: "Sabah texnologiya konfransında çıxış edəcəm"
Output: {
  "status": "success",
  "content": "men's formal tech conference outfit blazer shirt"
}

Input: "Toyda geyinmək üçün qəşəng bir don axtarıram"
Output: {
  "status": "success",
  "content": "elegant women's evening dress for wedding guest"
}

Input: "PHP ilə restful api necə yazılır?"
Output: {
  "status": "false",
  "content": "Not related to clothing or fashion"
}

You MUST return only valid JSON. No other text.`;

            this.model = this.genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: systemPrompt,
            });
            
            console.log("KlotoAI initialized successfully");
        } catch (error) {
            console.error("Failed to initialize Gemini AI:", error);
        }
    }

    // Bind event listeners
    bindEvents() {
        this.form.addEventListener("submit", (e) => this.handleQuery(e));
        this.sendBtn.addEventListener("click", (e) => this.handleQuery(e));
    }

    // Handle user query
    async handleQuery(e) {
        e.preventDefault();
        const query = this.input.value.trim();
        if (!query) return;

        this.showLoading("Düşünürəm...");

        try {
            const searchKeywords = await this.extractSearchKeywords(query);
            if (searchKeywords) {
                await this.searchAmazonProducts(searchKeywords);
            } else {
                this.showError("❌ Bu sorğu geyim və moda ilə bağlı deyil.");
            }
        } catch (error) {
            console.error("Query handling error:", error);
            this.showError("Xəta baş verdi. Lütfən yenidən cəhd edin.");
        }
    }

    // Extract search keywords using Gemini AI
    async extractSearchKeywords(query) {
        try {
            const result = await this.model.generateContent(query);
            const response = result.response;
            const text = response.text();

            console.log("Gemini response:", text);

            // Clean and parse JSON response
            let cleanText = text.trim();
            if (cleanText.includes('```json')) {
                cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            const json = JSON.parse(cleanText);
            console.log("Parsed JSON:", json);

            if (json.status === "success") {
                return json.content;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            throw new Error("AI cavabı alınmadı");
        }
    }

    // Search Amazon products using RapidAPI
    async searchAmazonProducts(searchQuery) {
        this.showLoading("Amazon-da məhsul axtarılır...");
        
        try {
            const response = await fetch(`https://real-time-amazon-data.p.rapidapi.com/search?page=1&country=US&sort_by=RELEVANCE&product_condition=ALL&is_prime=false&deals_and_discounts=NONE&query=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
                    'x-rapidapi-key': this.amazonApiKey
                }
            });

            const data = await response.json();
            
            if (data.status === "OK" && data.data && data.data.products) {
                this.displayProducts(data.data.products.slice(0, 6));
            } else {
                this.showError("❌ Məhsul tapılmadı");
            }
            
        } catch (error) {
            console.error("Amazon API error:", error);
            this.showError("❌ Amazon API xətası");
        }
    }

    // Display products in grid format
    displayProducts(products) {
        const productHTML = `
            <div style="
                max-height: 400px; 
                overflow-y: auto; 
                margin-top: 20px; 
                padding-right: 5px;
                scrollbar-width: thin;
                scrollbar-color: #ccc transparent;
            ">
                <div style="
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
                    gap: 12px;
                    padding-bottom: 10px;
                ">
                    ${products.map(product => this.createProductCard(product)).join('')}
                </div>
            </div>
        `;
        
        this.resultDiv.innerHTML = productHTML;
    }

    // Create individual product card
    createProductCard(product) {
        return `
            <div style="
                background: #f8f9fa; 
                border-radius: 15px; 
                padding: 12px; 
                border: 1px solid #e9ecef; 
                display: flex;
                flex-direction: column;
                height: 240px;
            ">
                <div style="
                    width: 100%; 
                    height: 120px; 
                    border-radius: 10px; 
                    margin-bottom: 8px;
                    background-image: url('${product.product_photo}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    background-color: #fff;
                "></div>
                <h4 style="
                    font-size: 12px; 
                    margin: 0 0 6px 0; 
                    line-height: 1.2; 
                    height: 36px; 
                    overflow: hidden; 
                    color: #333; 
                    font-weight: 500;
                    flex-grow: 1;
                ">${product.product_title.substring(0, 50)}...</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #000; font-size: 13px;">${product.product_price}</span>
                    <span style="background: #333; color: white; padding: 1px 4px; border-radius: 3px; font-size: 9px;">⭐ ${product.product_star_rating || 'N/A'}</span>
                </div>
                <a href="${product.product_url}" target="_blank" style="
                    display: block; 
                    background: #000; 
                    color: white; 
                    text-align: center; 
                    padding: 6px; 
                    border-radius: 8px; 
                    text-decoration: none; 
                    font-size: 11px; 
                    font-weight: 500;
                    margin-top: auto;
                ">Gör</a>
            </div>
        `;
    }

    // Show loading message
    showLoading(message) {
        this.resultDiv.innerHTML = message;
    }

    // Show error message
    showError(message) {
        this.resultDiv.textContent = message;
    }
}

// Initialize KlotoAI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KlotoAI();
});
