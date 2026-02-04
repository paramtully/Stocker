import LlmExternalService from "./llm.external";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default class LlmGemini implements LlmExternalService {
    private client: GoogleGenerativeAI;
    private model: string = "gemini-1.5-flash";

    constructor(apiKey: string = process.env.GEMINI_API_KEY!) {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set");
        }
        this.client = new GoogleGenerativeAI(apiKey);
    }

    // generate JSON response as a string from the model, returns the content of the response or an empty string if there is an error
    async generateJsonString(systemPrompt: string, userPrompt: string, temperature: number = 0.3): Promise<string> {
        try {
            const model = this.client.getGenerativeModel({
                model: this.model,
                systemInstruction: systemPrompt,
                generationConfig: {
                    temperature: temperature,
                    responseMimeType: "application/json",
                },
            });

            const result = await model.generateContent(userPrompt);
            const response = result.response;
            const content = response.text();

            if (!content) {
                throw new Error("No content returned from Gemini");
            }
            return content;
        } catch (error) {
            console.error(error);
            return '';
        }
    }
}
