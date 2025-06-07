import React, { useRef, useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Users, BarChart3, Brain, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { InsightCard } from "@/components/ai/InsightCard";
import { getDashboardInsights } from "@/lib/gemini";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useReactToPrint } from 'react-to-print';
import { ZReport } from '@/components/reports/ZReport';
import { Sale } from "@/types";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

// Fetches data for the Z-Report by calling our secure and efficient database function.
async function getZReportData(dateRange: DateRange): Promise<Sale[]> {
  const from = dateRange.from ? startOfDay(dateRange.from) : startOfDay(subDays(new Date(), 1));
  const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());

  const { data, error } = await supabase.rpc('get_z_report_data', {
    from_date: from.toISOString(),
    to_date: to.toISOString(),
  });

  if (error) {
    console.error("Error fetching Z-report data from RPC:", error);
    throw new Error(error.message);
  }
  
  return (data as Sale[]) || [];
}


// Function to fetch and compute quick stats. This remains the same.
async function getQuickStats() {
  const today = new Date();
  const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch sales from the last 24 hours
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('total, sale_items(quantity)')
    .gte('created_at', twentyFourHoursAgo);

  if (salesError) throw new Error(salesError.message);

  // Fetch new users from the last 24 hours
  // Note: This requires the 'users' table to be readable by authenticated users.
  // This will fail if RLS is too restrictive on the users table.
  const { count: newUsers, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', twentyFourHoursAgo);

  if (usersError) {
    console.warn("Could not fetch new users count. Check RLS policies on the 'users' table.", usersError.message)
  };

  // Calculate stats
  const revenue = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  const productsSold = sales.reduce((acc, sale) => acc + (sale.sale_items?.reduce((itemAcc, item) => itemAcc + item.quantity, 0) || 0), 0);
  const avgSale = sales.length > 0 ? revenue / sales.length : 0;

  return [
    { title: "Today's Revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign },
    { title: "Products Sold", value: productsSold.toString(), icon: Package },
    { title: "New Customers", value: newUsers?.toString() || '0', icon: Users },
    { title: "Avg. Sale Value", value: `$${avgSale.toFixed(2)}`, icon: BarChart3 },
  ];
}


export default function Dashboard() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<Sale[] | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 1)),
    to: endOfDay(new Date()),
  });

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    onBeforeGetContent: () => setIsPrinting(true),
    onAfterPrint: () => {
      setIsPrinting(false);
      setReportData(null); 
    },
  });

  const handleExportClick = async () => {
    try {
      if (!date?.from) {
        console.error("Date range is not selected.");
        return;
      }
      const data = await getZReportData(date);
      setReportData(data);
    } catch (error) {
      console.error("Failed to generate Z-report:", error);
      // You can add a user-facing toast notification here for errors
    }
  };

  useEffect(() => {
    if (reportData) {
      handlePrint();
    }
  }, [reportData, handlePrint]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s a summary of your business.
          </p>
        </div>
        <div className="flex items-center space-x-2">
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleExportClick}>Generate Z-Report</Button>
          <Button onClick={() => navigate('/pos')}>Create Sale</Button>
        </div>
      </div>

      <Suspense fallback={<QuickStatsSkeleton />}>
        <DashboardQuickStats />
      </Suspense>

      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI-Powered Insights
        </h2>
        <Suspense fallback={<InsightsSkeleton />}>
            <DashboardAIInsights />
        </Suspense>
      </div>

      <div className={isPrinting ? "print-mount" : "hidden"}>
          <ZReport ref={reportRef} reportData={reportData || []} reportDateRange={date || {}} />
      </div>
    </div>
  );
}

// --- Child Components for Suspense & Data Fetching ---

function DashboardQuickStats() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardQuickStats'],
    queryFn: getQuickStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <QuickStatsSkeleton />;
  }

  if (isError) {
    return (
       <div className="bg-destructive/10 text-destructive p-4 rounded-lg col-span-4">
        Failed to load quick stats.
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats?.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DashboardAIInsights() {
  const { data: insights, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardInsights'],
    queryFn: getDashboardInsights,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center gap-4">
        <AlertCircle className="h-6 w-6" />
        <div>
          <h3 className="font-bold">Failed to load AI Insights</h3>
          <p className="text-sm">{error instanceof Error ? error.message : "An unknown error occurred."}</p>
        </div>
      </div>
    )
  }

  if (!insights || insights.length === 0) {
     return (
      <div className="bg-muted/50 border text-muted-foreground p-4 rounded-lg flex items-center gap-4">
        <AlertCircle className="h-6 w-6" />
        <div>
          <h3 className="font-bold">No Insights Available</h3>
          <p className="text-sm">The AI could not generate any insights at this time. Please check back later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

// --- Skeleton Components ---

const QuickStatsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2 mb-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const InsightsSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
    </div>
);