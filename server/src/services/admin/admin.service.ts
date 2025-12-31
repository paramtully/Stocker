import UsersRepository from "server/src/repositories/interfaces/users.repository";
import IAdminService from "./IAdmin.service";
import UsersDrizzleRepository from "server/src/repositories/drizzle/user.drizzle";
import AdminMetrics from "server/src/domain/metrics/adminMetrics";
import PageViewsRepository from "server/src/repositories/interfaces/metrics/pageViews.repository";
import DailyMetricsRepository from "server/src/repositories/interfaces/metrics/dailyMetrics.repository";
import { DailyMetricsDrizzleRepository, PageViewsDrizzleRepository } from "server/src/repositories/drizzle/metrics";

export default class AdminService implements IAdminService {
    private readonly usersRepository: UsersRepository;
    private readonly pageViewsRepository: PageViewsRepository;
    private readonly dailyMetricsRepository: DailyMetricsRepository;

    constructor() {
        this.usersRepository = new UsersDrizzleRepository();
        this.pageViewsRepository = new PageViewsDrizzleRepository();
        this.dailyMetricsRepository = new DailyMetricsDrizzleRepository();
    }

    async checkAdmin(userId: string): Promise<boolean> {
        const user = await this.usersRepository.getUserById(userId);
        if (!user) {
            return false;
        }
        return user.role === "admin";
    }

    async getAdminMetrics(): Promise<AdminMetrics> {

        const [
            pageViewsToday,
            pageViewsThisWeek,
            pageViewsTotal,
            uniqueVisitorsToday,
            signupsToday,
            signupsTotal,
            totalUsers,
            recentActivity
        ] = await Promise.all([
            this.pageViewsRepository.getPageViewsToday(),
            this.pageViewsRepository.getPageViewsThisWeek(),
            this.pageViewsRepository.getPageViewsTotal(),
            this.pageViewsRepository.getUniqueVisitorsToday(),
            this.usersRepository.getSignupsToday(),
            this.usersRepository.getSignupsTotal(),
            this.usersRepository.getTotalUsers(),
            this.pageViewsRepository.getRecentPageViews(),
        ]);
        
        return {
            pageViews: {
                today: pageViewsToday,
                thisWeek: pageViewsThisWeek,
                total: pageViewsTotal,
            },
            visitors: {
                uniqueToday: uniqueVisitorsToday,
            },
            signups: {
                today: signupsToday,
                total: signupsTotal,
            },
            users: {
                total: totalUsers,
            },
            recentActivity: recentActivity,
            hosting: {
                estimatedMonthlyCost: 12,
                budgetLimit: 50,
                status: "healthy",
            },
        };
    }
}