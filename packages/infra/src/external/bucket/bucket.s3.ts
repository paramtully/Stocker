import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import BucketExternalService from "./bucket.external";

export default class BucketS3 implements BucketExternalService {
    private s3Client: S3Client;
    private readonly bucketName: string;

    constructor() {
        if (!process.env.AWS_REGION) {
            throw new Error("AWS_REGION environment variable must be set");
        }
        if (!process.env.S3_BUCKET) {
            throw new Error("S3_BUCKET environment variable must be set");
        }
        this.bucketName = process.env.S3_BUCKET;
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION,
        });
    }

    async putObject(key: string, data: string | Buffer, contentType: string = "application/json"): Promise<void> {
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: data,
            ContentType: contentType,
        }));
    }

    async getObject(key: string): Promise<string | null> {
        try {
            const response = await this.s3Client.send(new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));
            
            if (!response.Body) {
                return null;
            }

            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as ReadableStream<Uint8Array>) {
                chunks.push(chunk);
            }
            
            return Buffer.concat(chunks).toString('utf-8');
        } catch (error: unknown) {
            if (error instanceof Error && 'name' in error && error.name === 'NoSuchKey') {
                return null;
            }
            throw error;
        }
    }

    async deleteObject(key: string): Promise<void> {
        await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        }));
    }

    async listObjects(prefix: string): Promise<string[]> {
        const keys: string[] = [];
        let continuationToken: string | undefined;

        do {
            const response = await this.s3Client.send(new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }));

            if (response.Contents) {
                keys.push(...response.Contents.map(obj => obj.Key!).filter(Boolean));
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        return keys;
    }
}

