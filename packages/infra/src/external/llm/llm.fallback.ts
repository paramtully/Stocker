import LlmExternalService from "./llm.external";
import LlmOpenAI from "./llm.openAI";
import LlmGemini from "./llm.gemini";
// Future: Import other LLM providers as they're added
// import LlmAnthropic from "./llm.anthropic";

/**
 * Fallback service that tries multiple LLM providers
 * Automatically switches to next provider on errors or rate limits
 */
export default class LLMFallbackService implements LlmExternalService {
    private providers: LlmExternalService[];
    private currentProviderIndex: number = 0;
    private errorLog: Array<{ provider: string; error: string; timestamp: string }> = [];

    constructor() {
        // Order matters - try most reliable/cheapest first
        this.providers = [
            new LlmGemini(),
            new LlmOpenAI(),
            // Add other providers here as they're implemented
            // new LlmAnthropic(),
        ];
    }

    async generateJsonString(systemPrompt: string, userPrompt: string, temperature: number = 0.3): Promise<string> {
        const startIndex = this.currentProviderIndex;
        let attempts = 0;

        // Try all providers, starting from current
        while (attempts < this.providers.length) {
            const provider = this.providers[this.currentProviderIndex];
            const providerName = provider.constructor.name;

            try {
                const result = await provider.generateJsonString(systemPrompt, userPrompt, temperature);
                
                // Check if result is empty (indicates error in provider)
                if (!result || result.trim().length === 0) {
                    throw new Error("Empty response from LLM provider");
                }

                // Success - return result
                return result;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.logError(providerName, errorMsg);

                // Check if it's a rate limit error
                const isRateLimit = errorMsg.toLowerCase().includes('rate limit') || 
                                   errorMsg.toLowerCase().includes('quota') ||
                                   errorMsg.toLowerCase().includes('429');

                if (isRateLimit) {
                    console.warn(`Rate limit hit for ${providerName}, switching to next provider`);
                }

                // Move to next provider
                this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
                attempts++;

                // If we've tried all providers, wait a bit before retrying
                if (attempts === this.providers.length && this.currentProviderIndex === startIndex) {
                    console.warn("All LLM providers failed, waiting before retry...");
                    await this.delay(5000); // Wait 5 seconds
                    attempts = 0; // Reset attempts to try again
                }
            }
        }

        throw new Error("All LLM providers failed to generate response");
    }

    private logError(providerName: string, error: string): void {
        this.errorLog.push({
            provider: providerName,
            error,
            timestamp: new Date().toISOString(),
        });
    }

    getErrorLog(): Array<{ provider: string; error: string; timestamp: string }> {
        return [...this.errorLog];
    }

    clearErrorLog(): void {
        this.errorLog = [];
    }

    getCurrentProvider(): string {
        return this.providers[this.currentProviderIndex].constructor.name;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

