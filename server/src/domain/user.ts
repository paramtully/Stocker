export default interface User {
    id?: string;
    cognitoSub?: string;
    email?: string;
    name?: {
      first: string;
      last: string;
    };
    role: "admin" | "user" | "guest";
    emailPreferences: {
      enabled: boolean;
      deliveryHour: number;
    };
}