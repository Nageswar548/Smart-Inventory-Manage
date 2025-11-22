import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    lowStockItems: 0,
    revenueChange: 0,
    salesChange: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    // Calculate total revenue and sales
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.total, 0);
    const totalSales = sales.length;
    const totalProducts = products.length;
    const lowStockItems = products.filter((p: any) => p.quantity < p.reorderLevel).length;

    // Calculate changes (last 7 days vs previous 7 days)
    const now = Date.now();
    const last7Days = sales.filter((s: any) => 
      new Date(s.createdAt).getTime() > now - 7 * 24 * 60 * 60 * 1000
    );
    const previous7Days = sales.filter((s: any) => {
      const time = new Date(s.createdAt).getTime();
      return time > now - 14 * 24 * 60 * 60 * 1000 && time <= now - 7 * 24 * 60 * 60 * 1000;
    });

    const last7Revenue = last7Days.reduce((sum: number, sale: any) => sum + sale.total, 0);
    const prev7Revenue = previous7Days.reduce((sum: number, sale: any) => sum + sale.total, 0);
    const revenueChange = prev7Revenue > 0 ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100 : 0;
    const salesChange = previous7Days.length > 0 ? ((last7Days.length - previous7Days.length) / previous7Days.length) * 100 : 0;

    setStats({
      totalRevenue,
      totalSales,
      totalProducts,
      lowStockItems,
      revenueChange,
      salesChange,
    });

    // Prepare chart data (last 14 days)
    const dailyData: any = {};
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData[dateStr] = { date: dateStr, revenue: 0, sales: 0 };
    }

    sales.forEach((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      if (saleDate.getTime() > now - 14 * 24 * 60 * 60 * 1000) {
        const dateStr = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[dateStr]) {
          dailyData[dateStr].revenue += sale.total;
          dailyData[dateStr].sales += 1;
        }
      }
    });

    setChartData(Object.values(dailyData));

    // Calculate top products
    const productSales: any = {};
    sales.forEach((sale: any) => {
      if (!productSales[sale.productId]) {
        productSales[sale.productId] = {
          name: sale.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[sale.productId].quantity += sale.quantity;
      productSales[sale.productId].revenue += sale.total;
    });

    const sortedProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
    setTopProducts(sortedProducts);

    // Calculate category distribution
    const categoryStats: any = {};
    products.forEach((product: any) => {
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = 0;
      }
      categoryStats[product.category] += 1;
    });

    const categoryArray = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value,
    }));
    setCategoryData(categoryArray);
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your inventory management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              {stats.revenueChange !== 0 && (
                <div className={`flex items-center gap-1 ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span className="text-sm">{Math.abs(stats.revenueChange).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              {stats.salesChange !== 0 && (
                <div className={`flex items-center gap-1 ${stats.salesChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.salesChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span className="text-sm">{Math.abs(stats.salesChange).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
            <p className="text-2xl text-gray-900">{stats.totalSales}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Products</p>
            <p className="text-2xl text-gray-900">{stats.totalProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
            <p className="text-2xl text-gray-900">{stats.lowStockItems}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Sales (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
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

        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
