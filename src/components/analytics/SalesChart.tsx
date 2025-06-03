import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesChartProps {
  data: Array<{
    date: string;
    sales: number;
    transactions: number;
  }>;
  type?: "line" | "bar";
  title: string;
  className?: string;
}

export function SalesChart({
  data,
  type = "line",
  title,
  className,
}: SalesChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const Chart = type === "line" ? LineChart : BarChart;
  const Element = type === "line" ? Line : Bar;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Chart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              stroke="#e2e8f0"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="date"
              className="text-xs fill-muted-foreground"
              axisLine={true}
              tickLine={true}
              tick={{ fontSize: 12 }}
              type="category"
              interval="preserveStartEnd"
              minTickGap={5}
            />
            <YAxis
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => `$${value}`}
              axisLine={true}
              tickLine={true}
              tick={{ fontSize: 12 }}
              type="number"
              domain={['dataMin', 'dataMax']}
              width={60}
            />
            <Tooltip
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)}`,
                name === "sales" ? "Sales" : "Transactions",
              ]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Element
              dataKey="sales"
              stroke="hsl(214 100% 35%)"
              fill="hsl(214 100% 35%)"
              strokeWidth={type === 'line' ? 2 : 0}
              dot={type === 'line' ? { fill: 'hsl(214 100% 35%)', strokeWidth: 2, r: 4 } : false}
              animationDuration={300}
            />
            />
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}