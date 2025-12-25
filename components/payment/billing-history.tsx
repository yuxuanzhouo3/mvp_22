"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const translations = {
  en: {
    billingHistory: "Billing History",
    viewPaymentRecords: "View your payment records and transaction history",
    loading: "Loading...",
    error: "Error loading billing history",
    noRecords: "No billing records found",
    startMakingPayments: "Start making payments to see your history here",
    refresh: "Refresh",
    date: "Date",
    description: "Description",
    amount: "Amount",
    status: "Status",
    method: "Method",
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
  },
  zh: {
    billingHistory: "账单历史",
    viewPaymentRecords: "查看您的支付记录和交易历史",
    loading: "加载中...",
    error: "加载账单历史时出错",
    noRecords: "未找到账单记录",
    startMakingPayments: "开始付款以在此处查看历史记录",
    refresh: "刷新",
    date: "日期",
    description: "描述",
    amount: "金额",
    status: "状态",
    method: "方式",
    paid: "已支付",
    pending: "待处理",
    failed: "失败",
    refunded: "已退款",
  },
};

interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  description: string;
  paymentMethod: string;
}

interface BillingHistoryProps {
  userId: string;
  language?: "en" | "zh";
}

export function BillingHistory({ userId, language = "en" }: BillingHistoryProps) {
  const t = translations[language];
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    const fetchBillingHistory = async () => {
      if (!userId || !session) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = session.access_token;

        const resp = await fetch(`/api/payment/history?page=1&pageSize=50`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          throw new Error("Failed to fetch billing history");
        }

        const apiData = await resp.json();
        setRecords(apiData.records || []);
        setError(null);
      } catch (err) {
        console.error("Billing history error:", err);
        setError("Failed to load billing history");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, [userId, session]);

  const getStatusBadge = (status: BillingRecord["status"]) => {
    const statusConfig = {
      paid: {
        variant: "default" as const,
        text: t.paid,
        className: "bg-green-100 text-green-800 hover:bg-green-100",
      },
      pending: {
        variant: "secondary" as const,
        text: t.pending,
        className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      },
      failed: {
        variant: "destructive" as const,
        text: "Cancelled",
        className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
      },
      refunded: {
        variant: "outline" as const,
        text: t.refunded,
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            {t.loading}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive py-8">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {t.billingHistory}
        </CardTitle>
        <CardDescription>
          {t.viewPaymentRecords}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.noRecords}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.description}</TableHead>
                <TableHead>{t.amount}</TableHead>
                <TableHead>{t.method}</TableHead>
                <TableHead>{t.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell className="font-medium">
                    {formatAmount(record.amount, record.currency)}
                  </TableCell>
                  <TableCell>{record.paymentMethod}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}



