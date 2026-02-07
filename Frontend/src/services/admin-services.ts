/**
 * Admin Service - API functions for admin dashboard
 * Task 2.1: Dashboard User Statistics
 */

// Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to get auth header
const getAuthHeader = (): Record<string, string> => {
    // Check both storage locations (remember me uses localStorage)
    const token = localStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper to handle API errors
const handleApiError = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'API error' }));
        throw new Error(error.detail || 'API request failed');
    }
    return response.json();
};

// Types
export interface UserResponse {
    user_id: string;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
    last_login_at: string | null;
    created_at: string;
}

export interface UsersListResponse {
    users: UserResponse[];
    total: number;
}

export interface SystemMetricsResponse {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_connections: number;
    uptime_seconds: number;
}

/**
 * Fetch all users from the API
 * GET /api/admin/users
 */
export const getUsers = async (): Promise<UsersListResponse> => {
    const response = await fetch(
        `${API_BASE_URL}/api/admin/users`,
        { headers: getAuthHeader() }
    );
    return handleApiError(response);
};

/**
 * Fetch system metrics from the API
 * GET /api/admin/system/metrics
 */
export const getSystemMetrics = async (): Promise<SystemMetricsResponse> => {
    const response = await fetch(
        `${API_BASE_URL}/api/admin/system/metrics`,
        { headers: getAuthHeader() }
    );
    return handleApiError(response);
};

/**
 * Calculate user statistics from the user list
 */
export const calculateUserStats = (users: UserResponse[]) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total active users (is_active = true)
    const totalUsers = users.filter(u => u.is_active).length;

    // Active users (logged in within last 30 days)
    const activeUsers = users.filter(u => {
        if (!u.last_login_at) return false;
        const lastLogin = new Date(u.last_login_at);
        return lastLogin >= thirtyDaysAgo;
    }).length;

    // New users this month
    const newUsersThisMonth = users.filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt >= startOfMonth;
    }).length;

    return {
        totalUsers,
        activeUsers,
        newUsersThisMonth
    };
};

/**
 * Format uptime from seconds to readable string
 */
export const formatUptime = (uptimeSeconds: number): string => {
    const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));

    if (days > 0) {
        return `${days}d ${hours}h`;
    }
    return `${hours}h`;
};

/**
 * Calculate uptime percentage (assuming 30-day window)
 */
export const calculateUptimePercentage = (uptimeSeconds: number): string => {
    // For now, if the system is up, we consider it at 99.9%+
    // In production, this would come from a monitoring service
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    const percentage = Math.min((uptimeSeconds / thirtyDaysInSeconds) * 100, 99.9);
    return percentage >= 99 ? '99.9%' : `${percentage.toFixed(1)}%`;
};