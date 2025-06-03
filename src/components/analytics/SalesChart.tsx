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
          <Chart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs fill-muted-foreground"
              axisLine={true}
              tickLine={true}
              tick={true}
              type="category"
            />
            <YAxis
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => `$${value}`}
              axisLine={true}
              tickLine={true}
              tick={true}
              type="number"
              domain={["dataMin", "dataMax"]}
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
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              strokeWidth={type === "line" ? 2 : 0}
            />
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
