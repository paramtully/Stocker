export default interface BucketExternalService {
    putObject(key: string, data: string | Buffer, contentType?: string): Promise<void>;
    getObject(key: string): Promise<string | null>;
    deleteObject(key: string): Promise<void>;
    listObjects(prefix: string): Promise<string[]>;
}


