"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface MembershipChartDataPoint {
  month: string;
  approved: number;
  pending: number;
}

interface MembershipStatsChartProps {
  data: MembershipChartDataPoint[];
  trendPercentage: number | null;
  approvalRate?: number; // Optional: if you want to display it here
  timePeriodDescription?: string; // e.g., "Last 6 Months"
}

const chartConfig = {
  approved: {
    label: "Approved Members",
    color: "hsl(var(--chart-1))", // Using primary chart color
  },
  pending: {
    label: "Pending Applications",
    color: "hsl(var(--chart-2))", // Using secondary chart color
  },
} satisfies ChartConfig

export function MembershipStatsChart({
  data,
  trendPercentage,
  approvalRate,
  timePeriodDescription = "Last 6 Months"
}: MembershipStatsChartProps) {
  const currentMonthDescription = data.length > 0 ? 
    new Date(Date.parse(data[data.length -1].month +" 1, 2000")).toLocaleString('default', { month: 'long' }) + " - " + new Date().getFullYear() 
    : "Current Period";
  
  const chartTitle = `Membership Applications`;


  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>{timePeriodDescription}</CardDescription>
        {approvalRate !== undefined && (
             <div className="flex items-center gap-2 pt-2">
                <div className="text-sm font-medium">Overall Approval Rate:</div>
                <div className="text-lg font-bold text-enugu">{approvalRate.toFixed(0)}%</div>
            </div>
        )}
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)} // Jan, Feb, etc.
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" hideLabel />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="approved"
              stackId="a"
              fill="var(--color-approved)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="pending"
              stackId="a"
              fill="var(--color-pending)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {trendPercentage !== null && trendPercentage !== undefined && (
          <div className="flex gap-2 font-medium leading-none">
            {trendPercentage >= 0 ? "Trending up" : "Trending down"} by {Math.abs(trendPercentage).toFixed(1)}% this period
            <TrendingUp className={`h-4 w-4 ${trendPercentage < 0 ? 'transform rotate-180 text-red-500' : 'text-green-500'}`} />
          </div>
        )}
        <div className="leading-none text-muted-foreground">
          Showing new and approved applications for the {timePeriodDescription.toLowerCase()}
        </div>
      </CardFooter>
    </Card>
  )
} 