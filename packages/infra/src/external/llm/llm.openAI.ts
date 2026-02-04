import LlmExternalService from "./llm.external";
import OpenAI from "openai";

export default class LlmOpenAI implements LlmExternalService { 
    private client: OpenAI;
    private model: string = "gpt-4o";

    constructor(apiKey: string = process.env.OPENAI_API_KEY!) {
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is not set");
        }
        this.client = new OpenAI({
            apiKey: apiKey,
        });
    }

    // generate JSON response as a string from the model, returns the content of the response or an empty string if there is an error
    async generateJsonString(systemPrompt: string, userPrompt: string, temperature: number = 0.3): Promise<string> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                response_format: {type: 'json_object'},
                temperature: temperature,
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error("No content returned from OpenAI");
            }
            return content;
        } catch (error) {
            console.error(error);
            return '';
        }
    }


}   