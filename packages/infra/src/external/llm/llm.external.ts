
export default interface LlmExternalService {
    generateJsonString(systemPrompt: string, userPrompt: string, temperature?: number): Promise<string>;
}