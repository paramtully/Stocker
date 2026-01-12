import AdminMetrics from "packages/domain/src/metrics/adminMetrics";

export default interface IAdminService {
    checkAdmin(userId: string): Promise<boolean>;
    getAdminMetrics(): Promise<AdminMetrics>;
}