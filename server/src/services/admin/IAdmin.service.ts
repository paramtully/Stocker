import AdminMetrics from "server/src/domain/metrics/adminMetrics";

export default interface IAdminService {
    checkAdmin(userId: string): Promise<boolean>;
    getAdminMetrics(): Promise<AdminMetrics>;
}