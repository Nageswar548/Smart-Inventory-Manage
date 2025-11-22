import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription } from './ui/alert';

interface ForecastData {
  productId: string;
  productName: string;
  historicalAverage: number;
  predictedDemand: number;
  recommendedReorder: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  forecastChart: Array<{ date: string; actual?: number; predicted: number }>;
}

export default function Forecasting() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateForecasts();
  }, []);

  const generateForecasts = () => {
    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      const products = JSON.parse(localStorage.getItem('products') || '[]');

      const forecastData: ForecastData[] = [];

      products.forEach((product: any) => {
        const productSales = sales.filter((s: any) => s.productId === product.id);
        
        if (productSales.length > 0) {
          // Calculate time series data
          const dailySales = calculateDailySales(productSales);
          const historicalAverage = calculateAverage(dailySales);
          const trend = calculateTrend(dailySales);
          const seasonality = calculateSeasonality(dailySales);
          
          // Forecast next 7 days using simplified time series analysis
          const predictedDemand = forecastDemand(historicalAverage, trend, seasonality);
          const confidence = calculateConfidence(dailySales);
          
          // Generate forecast chart
          const forecastChart = generateForecastChart(dailySales, predictedDemand, trend);
          
          // Calculate recommended reorder quantity
          const recommendedReorder = Math.ceil(predictedDemand * 7); // 7 days of stock
          
          forecastData.push({
            productId: product.id,
            productName: product.name,
            historicalAverage,
            predictedDemand,
            recommendedReorder,
            confidence,
            trend: trend.direction,
            trendPercentage: trend.percentage,
            forecastChart,
          });
        }
      });

      setForecasts(forecastData.sort((a, b) => b.predictedDemand - a.predictedDemand));
      if (forecastData.length > 0) {
        setSelectedProduct(forecastData[0]);
      }
      setLoading(false);
    }, 1000);
  };

  const calculateDailySales = (sales: any[]) => {
    const dailyMap: { [key: string]: number } = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toDateString();
      dailyMap[date] = (dailyMap[date] || 0) + sale.quantity;
    });

    return Object.values(dailyMap);
  };

  const calculateAverage = (data: number[]) => {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  };

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return { direction: 'stable' as const, percentage: 0 };

    // Simple linear regression
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = calculateAverage(data);

    let numerator = 0;
    let denominator = 0;

    data.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const percentage = (slope / yMean) * 100;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (percentage > 5) direction = 'up';
    else if (percentage < -5) direction = 'down';

    return { direction, percentage };
  };

  const calculateSeasonality = (data: number[]) => {
    // Simplified seasonality factor (day of week effect)
    const dayOfWeek = new Date().getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.2;
    return weekendFactor;
  };

  const forecastDemand = (average: number, trend: any, seasonality: number) => {
    // Time series forecasting formula: Forecast = (Average + Trend) * Seasonality
    const trendAdjustment = (average * trend.percentage) / 100;
    return Math.max(0, (average + trendAdjustment) * seasonality);
  };

  const calculateConfidence = (data: number[]) => {
    if (data.length < 5) return 60;
    if (data.length < 10) return 70;
    if (data.length < 20) return 80;
    return 90;
  };

  const generateForecastChart = (historicalData: number[], predictedDemand: number, trend: any) => {
    const chart = [];
    
    // Last 14 days of historical data
    const last14 = historicalData.slice(-14);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      chart.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual: last14[i] || 0,
      });
    }

    // Next 7 days forecast
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Apply trend to prediction
      const trendMultiplier = 1 + (trend.percentage / 100) * (i / 7);
      const prediction = predictedDemand * trendMultiplier;
      
      chart.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted: Math.max(0, prediction),
      });
    }

    return chart;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-600 rotate-90" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'bg-green-100 text-green-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const applyRecommendation = (forecast: ForecastData) => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const newNotification = {
      id: Date.now().toString(),
      type: 'restock',
      title: 'Restock Recommendation Applied',
      message: `Recommended to reorder ${forecast.recommendedReorder} units of ${forecast.productName}`,
      productId: forecast.productId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    alert(`Restock recommendation applied for ${forecast.productName}! Notification created.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">AI Demand Forecasting</h1>
          <p className="text-gray-600">Predict future demand and optimize inventory</p>
        </div>
        <Button onClick={generateForecasts} disabled={loading}>
          <TrendingUp className="w-4 h-4 mr-2" />
          {loading ? 'Analyzing...' : 'Refresh Forecast'}
        </Button>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          AI forecasting uses time-series analysis with trend detection and seasonality factors to predict future demand based on historical sales data.
        </AlertDescription>
      </Alert>

      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {forecasts.slice(0, 3).map((forecast) => (
          <Card 
            key={forecast.productId}
            className={`cursor-pointer transition-all ${
              selectedProduct?.productId === forecast.productId ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedProduct(forecast)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className={getTrendColor(forecast.trend)}>
                  {getTrendIcon(forecast.trend)}
                  <span className="ml-1">{Math.abs(forecast.trendPercentage).toFixed(1)}%</span>
                </Badge>
              </div>
              <h3 className="text-gray-900 mb-2">{forecast.productName}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Predicted Daily Demand:</span>
                  <span className="text-gray-900">{forecast.predictedDemand.toFixed(1)} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="text-gray-900">{forecast.confidence}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Forecast View */}
      {selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Demand Forecast - {selectedProduct.productName}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={selectedProduct.forecastChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Historical Sales"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predicted Demand"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-blue-900">
                  <Calendar className="w-5 h-5" />
                  <span>Next 7 Days</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Expected Demand:</span>
                    <span className="text-blue-900">
                      {(selectedProduct.predictedDemand * 7).toFixed(0)} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Historical Avg:</span>
                    <span className="text-blue-900">
                      {selectedProduct.historicalAverage.toFixed(1)} units/day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Trend:</span>
                    <span className="text-blue-900 flex items-center gap-1">
                      {getTrendIcon(selectedProduct.trend)}
                      {selectedProduct.trend}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-green-900">
                  <Package className="w-5 h-5" />
                  <span>Reorder Recommendation</span>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl text-green-900">
                    {selectedProduct.recommendedReorder} units
                  </p>
                  <p className="text-sm text-green-700">
                    Based on {selectedProduct.confidence}% confidence prediction
                  </p>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => applyRecommendation(selectedProduct)}
                >
                  Apply Recommendation
                </Button>
              </div>

              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <p className="mb-2">Forecast Algorithm:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Time-series analysis</li>
                  <li>Trend detection (linear regression)</li>
                  <li>Seasonality adjustment</li>
                  <li>Historical data weighting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Forecasts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Product Forecasts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecasts.map((forecast) => (
              <div
                key={forecast.productId}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedProduct?.productId === forecast.productId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedProduct(forecast)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">{forecast.productName}</p>
                    <p className="text-sm text-gray-500">
                      Avg: {forecast.historicalAverage.toFixed(1)} units/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Predicted Demand</p>
                    <p className="text-gray-900">{forecast.predictedDemand.toFixed(1)} units/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Reorder Qty</p>
                    <p className="text-gray-900">{forecast.recommendedReorder} units</p>
                  </div>
                  <Badge className={getTrendColor(forecast.trend)}>
                    {getTrendIcon(forecast.trend)}
                    <span className="ml-1">{forecast.trend}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {forecasts.length === 0 && !loading && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No forecast data available</p>
              <p className="text-sm text-gray-500 mt-2">
                Generate sales data to see AI predictions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
