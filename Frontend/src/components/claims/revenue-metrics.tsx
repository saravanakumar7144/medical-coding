/**
 * Revenue Metrics Dashboard
 * Phase 8: EHR Integration - Revenue Cycle Analytics
 *
 * Features:
 * - Key revenue KPIs (total revenue, collections rate, A/R aging)
 * - Denial rate trends over time
 * - Payment analytics by payer
 * - Days in A/R calculation
 * - Payer performance comparison
 * - Revenue trend charts
 */

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';

interface RevenueMetrics {
  total_charges: number;
  total_payments: number;
  total_adjustments: number;
  net_collections_rate: number;
  gross_collections_rate: number;
  denial_rate: number;
  average_days_to_payment: number;
  ar_0_30_days: number;
  ar_31_60_days: number;
  ar_61_90_days: number;
  ar_over_90_days: number;
  total_ar: number;
}

interface PayerPerformance {
  payer_id: string;
  payer_name: string;
  total_claims: number;
  total_charges: number;
  total_payments: number;
  denied_claims: number;
  denial_rate: number;
  average_days_to_payment: number;
  net_collection_rate: number;
}

interface MonthlyTrend {
  month: string;
  charges: number;
  payments: number;
  denials: number;
  denial_rate: number;
}

export function RevenueMetrics() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [payerPerformance, setPayerPerformance] = useState<PayerPerformance[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch metrics
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const url = new URL(`${apiUrl}/api/claims/revenue-metrics`);
      url.searchParams.append('days', dateRange);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payer performance
  const fetchPayerPerformance = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const url = new URL(`${apiUrl}/api/claims/payer-performance`);
      url.searchParams.append('days', dateRange);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayerPerformance(data);
      }
    } catch (error) {
      console.error('Error fetching payer performance:', error);
    }
  };

  // Fetch monthly trends
  const fetchMonthlyTrends = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${apiUrl}/api/claims/monthly-trends?months=12`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyTrends(data);
      }
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchPayerPerformance();
    fetchMonthlyTrends();
  }, [dateRange]);

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === null || amount === undefined) return '-';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format percentage
  const formatPercentage = (value?: number) => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(1)}%`;
  };

  // Get trend indicator
  const getTrendIndicator = (value: number, threshold: number, higherIsBetter: boolean = true) => {
    const isGood = higherIsBetter ? value >= threshold : value <= threshold;
    return isGood ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Metrics</h1>
          <p className="text-muted-foreground">Revenue cycle analytics and performance indicators</p>
        </div>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="60">Last 60 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && !metrics ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.total_charges)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics?.total_payments)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjustments: {formatCurrency(metrics?.total_adjustments)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Net Collection Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {formatPercentage(metrics?.net_collections_rate)}
                  {metrics && getTrendIndicator(metrics.net_collections_rate, 95)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: ≥95%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Denial Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  {formatPercentage(metrics?.denial_rate)}
                  {metrics && getTrendIndicator(metrics.denial_rate, 5, false)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;5%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* A/R Aging & Days to Payment */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Accounts Receivable Aging
                </CardTitle>
                <CardDescription>Distribution of outstanding receivables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total A/R</span>
                    <span className="text-lg font-bold">{formatCurrency(metrics?.total_ar)}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">0-30 Days</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(metrics?.ar_0_30_days)}</div>
                        <div className="text-xs text-muted-foreground">
                          {metrics?.total_ar ? formatPercentage((metrics.ar_0_30_days / metrics.total_ar) * 100) : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm">31-60 Days</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(metrics?.ar_31_60_days)}</div>
                        <div className="text-xs text-muted-foreground">
                          {metrics?.total_ar ? formatPercentage((metrics.ar_31_60_days / metrics.total_ar) * 100) : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm">61-90 Days</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(metrics?.ar_61_90_days)}</div>
                        <div className="text-xs text-muted-foreground">
                          {metrics?.total_ar ? formatPercentage((metrics.ar_61_90_days / metrics.total_ar) * 100) : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Over 90 Days</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">{formatCurrency(metrics?.ar_over_90_days)}</div>
                        <div className="text-xs text-muted-foreground">
                          {metrics?.total_ar ? formatPercentage((metrics.ar_over_90_days / metrics.total_ar) * 100) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Average Days to Payment
                </CardTitle>
                <CardDescription>Payment cycle performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="text-4xl font-bold">{metrics?.average_days_to_payment?.toFixed(1) || '-'}</div>
                    <p className="text-sm text-muted-foreground mt-1">days</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">≤30 days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      {metrics && metrics.average_days_to_payment <= 30 ? (
                        <Badge className="bg-green-500">On Target</Badge>
                      ) : (
                        <Badge className="bg-red-500">Needs Improvement</Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Collection Rates</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Net Collection Rate</span>
                        <span className="font-medium">{formatPercentage(metrics?.net_collections_rate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Gross Collection Rate</span>
                        <span className="font-medium">{formatPercentage(metrics?.gross_collections_rate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payer Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Payer Performance
              </CardTitle>
              <CardDescription>Performance metrics by insurance payer</CardDescription>
            </CardHeader>
            <CardContent>
              {payerPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payer data available for this period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payer</TableHead>
                      <TableHead className="text-right">Total Claims</TableHead>
                      <TableHead className="text-right">Total Charges</TableHead>
                      <TableHead className="text-right">Total Payments</TableHead>
                      <TableHead className="text-right">Collection Rate</TableHead>
                      <TableHead className="text-right">Denial Rate</TableHead>
                      <TableHead className="text-right">Avg Days to Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payerPerformance.map((payer) => (
                      <TableRow key={payer.payer_id}>
                        <TableCell className="font-medium">{payer.payer_name}</TableCell>
                        <TableCell className="text-right">{payer.total_claims}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payer.total_charges)}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {formatCurrency(payer.total_payments)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {formatPercentage(payer.net_collection_rate)}
                            {getTrendIndicator(payer.net_collection_rate, 95)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={payer.denial_rate > 5 ? 'text-red-600 font-semibold' : ''}>
                              {formatPercentage(payer.denial_rate)}
                            </span>
                            {getTrendIndicator(payer.denial_rate, 5, false)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {payer.average_days_to_payment.toFixed(1)} days
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Last 12 months performance</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trend data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Charges</TableHead>
                        <TableHead className="text-right">Payments</TableHead>
                        <TableHead className="text-right">Denials</TableHead>
                        <TableHead className="text-right">Denial Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyTrends.map((trend) => (
                        <TableRow key={trend.month}>
                          <TableCell className="font-medium">{trend.month}</TableCell>
                          <TableCell className="text-right">{formatCurrency(trend.charges)}</TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {formatCurrency(trend.payments)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {trend.denials}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={trend.denial_rate > 5 ? 'text-red-600 font-semibold' : ''}>
                              {formatPercentage(trend.denial_rate)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
