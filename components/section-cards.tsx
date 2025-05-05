import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


type SectionCardsProps = {
  data: {
    totalMembers: number;
    upcomingEvents: number;
    blogPosts: number;
    growthRate: number;
    metrics: {
      membershipChange: number;
      eventChange: number;
      postChange: number;
    };
  };
}

function TrendText({ value }: { value: number }) {
  const isUp = value >= 0
  const Icon = isUp ? TrendingUpIcon : TrendingDownIcon
  const text = isUp ? "Trending up this month" : "Trending down this month"
  return (
    <div className="line-clamp-1 flex gap-2 font-medium">
      {text} <Icon className="size-4" />
    </div>
  )
}

function TrendBadge({ value }: { value: number }) {
  const isUp = value >= 0
  const Icon = isUp ? TrendingUpIcon : TrendingDownIcon
  const color = isUp ? "text-green-600" : "text-red-600"

  return (
    <Badge variant="outline" className={`flex gap-1 rounded-lg text-[11px] ${color}`}>
      <Icon className="size-3" />
      {isUp ? "+" : "-"}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  )
}

export function SectionCards({ data }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Membership Requests</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.totalMembers}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge value={data.metrics.membershipChange} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
            <TrendText value={data.metrics.membershipChange} />
          <div className="line-clamp-1 flex gap-2 font-medium">
          </div>
          <div className="text-muted-foreground">
            Membership requests for the last 1 month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Upcoming Events</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {data.upcomingEvents}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge value={data.metrics.eventChange} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <TrendText value={data.metrics.eventChange} />
          </div>
          <div className="text-muted-foreground">
            Number of Events in the next month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Blog Posts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.blogPosts}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge value={data.metrics.postChange} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <TrendText value={data.metrics.postChange} />
          </div>
          <div className="text-muted-foreground">News Released in the past month</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {data.growthRate.toFixed(1)}%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge value={data.growthRate} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <TrendText value={data.growthRate} />
          </div>
          <div className="text-muted-foreground">Number of approved applications in the past month</div>
        </CardFooter>
      </Card>
    </div>
  )
}
