
export default interface LlmExternalService {
    generateJsonString(systemPrompt: string, userPrompt: string): Promise<string>;
}