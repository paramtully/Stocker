import PageView from "./PageView";

export default interface AdminMetrics {
  pageViews: {
    today: number,
    thisWeek: number,
    total: number,
  },
  visitors: {
    uniqueToday: number,
  },
  signups: {
    today: number,
    total: number,
  },
  users: {
    total: number,
  },
  recentActivity: PageView[],
  hosting: {
  estimatedMonthlyCost: number;
  budgetLimit: number;
  status: string;
};
}