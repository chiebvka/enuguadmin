"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MembershipStatsChart } from "@/app/protected/members/_components/membership-stats-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // For loading/error states

interface MembershipChartDataPoint {
  month: string;
  approved: number;
  pending: number;
}

export default function DashboardChart() {
  const [chartData, setChartData] = useState<MembershipChartDataPoint[]>([]);
  const [trendPercentage, setTrendPercentage] = useState<number | null>(null);
  const [approvalRate, setApprovalRate] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/dashboard');
        const data = response.data;

        if (data && data.chartData && data.sectionCards) {
          setChartData(data.chartData);
          setTrendPercentage(data.membershipTrend);
          setApprovalRate(data.sectionCards.growthRate);
        } else {
          setError("Failed to fetch complete chart data. Response might be malformed.");
          console.error("API response missing expected fields:", data);
        }
      } catch (err: any) {
        console.error("Error fetching dashboard chart data:", err);
        const errorMessage = err.response?.data?.error || err.message || "Failed to load chart data.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership Applications</CardTitle>
          <CardDescription>Last 6 Months</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p>Loading chart data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership Applications</CardTitle>
          <CardDescription>Error</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-red-500">
          <p>Error loading chart: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 && !loading) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Membership Applications</CardTitle>
          <CardDescription>Last 6 Months</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p>No data available to display the chart.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <MembershipStatsChart
      data={chartData}
      trendPercentage={trendPercentage}
      approvalRate={approvalRate}
      timePeriodDescription="Last 6 Months"
    />
  );
}