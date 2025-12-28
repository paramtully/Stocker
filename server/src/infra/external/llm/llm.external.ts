
export default interface LlmExternalService {
    generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}