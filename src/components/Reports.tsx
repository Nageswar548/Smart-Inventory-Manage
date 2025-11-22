import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [timeRange, setTimeRange] = useState('7days');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    generateReport();
  }, [timeRange]);

  const generateReport = () => {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    const now = Date.now();
    let daysBack = 7;
    if (timeRange === '30days') daysBack = 30;
    else if (timeRange === '90days') daysBack = 90;

    const filteredSales = sales.filter((s: any) => 
      new Date(s.createdAt).getTime() > now - daysBack * 24 * 60 * 60 * 1000
    );

    // Calculate metrics
    const totalRevenue = filteredSales.reduce((sum: number, s: any) => sum + s.total, 0);
    const totalSales = filteredSales.length;
    const totalDiscount = filteredSales.reduce((sum: number, s: any) => sum + s.discountAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Daily revenue trend
    const dailyData: any = {};
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData[dateStr] = { date: dateStr, revenue: 0, sales: 0 };
    }

    filteredSales.forEach((sale: any) => {
      const dateStr = new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += sale.total;
        dailyData[dateStr].sales += 1;
      }
    });

    // Top products
    const productSales: any = {};
    filteredSales.forEach((sale: any) => {
      if (!productSales[sale.productId]) {
        productSales[sale.productId] = {
          id: sale.productId,
          name: sale.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[sale.productId].quantity += sale.quantity;
      productSales[sale.productId].revenue += sale.total;
    });

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment method distribution
    const paymentMethods: any = { cash: 0, card: 0, upi: 0 };
    filteredSales.forEach((sale: any) => {
      paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
    });

    const paymentData = Object.entries(paymentMethods).map(([method, amount]) => ({
      method: method.toUpperCase(),
      amount,
    }));

    // Category performance
    const categoryPerformance: any = {};
    filteredSales.forEach((sale: any) => {
      const product = products.find((p: any) => p.id === sale.productId);
      if (product) {
        if (!categoryPerformance[product.category]) {
          categoryPerformance[product.category] = {
            category: product.category,
            revenue: 0,
            quantity: 0,
          };
        }
        categoryPerformance[product.category].revenue += sale.total;
        categoryPerformance[product.category].quantity += sale.quantity;
      }
    });

    setReportData({
      totalRevenue,
      totalSales,
      totalDiscount,
      averageOrderValue,
      dailyTrend: Object.values(dailyData),
      topProducts,
      paymentData,
      categoryPerformance: Object.values(categoryPerformance),
    });
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = 'Sales Report\n\n';
    csv += `Period: ${timeRange === '7days' ? 'Last 7 Days' : timeRange === '30days' ? 'Last 30 Days' : 'Last 90 Days'}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csv += 'Summary\n';
    csv += `Total Revenue,$${reportData.totalRevenue.toFixed(2)}\n`;
    csv += `Total Sales,${reportData.totalSales}\n`;
    csv += `Average Order Value,$${reportData.averageOrderValue.toFixed(2)}\n`;
    csv += `Total Discounts,$${reportData.totalDiscount.toFixed(2)}\n\n`;

    csv += 'Top Products\n';
    csv += 'Product Name,Quantity Sold,Revenue\n';
    reportData.topProducts.forEach((p: any) => {
      csv += `${p.name},${p.quantity},$${p.revenue.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${timeRange}-${Date.now()}.csv`;
    a.click();
  };

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and analytics</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <p className="text-2xl text-gray-900">${reportData.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
            <p className="text-2xl text-gray-900">{reportData.totalSales}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
            </div>
            <p className="text-2xl text-gray-900">${reportData.averageOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Total Discounts</p>
            </div>
            <p className="text-2xl text-gray-900">${reportData.totalDiscount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Revenue ($)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8b5cf6" name="Sales Count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topProducts.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <p className="text-gray-900">${product.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods & Categories */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reportData.paymentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="method" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.categoryPerformance.map((cat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Badge variant="outline" className="mb-1">{cat.category}</Badge>
                      <p className="text-xs text-gray-500">{cat.quantity} units sold</p>
                    </div>
                    <p className="text-gray-900">${cat.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
