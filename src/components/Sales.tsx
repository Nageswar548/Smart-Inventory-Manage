import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  discount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '1',
    discount: '0',
    paymentMethod: 'cash',
    customerName: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [searchTerm, sales]);

  const loadData = () => {
    const storedSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    setSales(storedSales.sort((a: Sale, b: Sale) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setProducts(storedProducts);
  };

  const filterSales = () => {
    if (!searchTerm) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(sale =>
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSales(filtered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    const quantity = parseInt(formData.quantity);
    if (quantity > product.quantity) {
      alert('Insufficient stock available');
      return;
    }

    const subtotal = product.price * quantity;
    const discount = parseFloat(formData.discount);
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;

    const newSale: Sale = {
      id: `INV-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      subtotal,
      discount,
      discountAmount,
      total,
      paymentMethod: formData.paymentMethod,
      customerName: formData.customerName || 'Walk-in Customer',
      createdAt: new Date().toISOString(),
    };

    // Update sales
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem('sales', JSON.stringify(updatedSales));

    // Update product quantity
    const updatedProducts = products.map(p =>
      p.id === product.id
        ? { ...p, quantity: p.quantity - quantity }
        : p
    );
    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    // Check if low stock and create notification
    const updatedProduct = updatedProducts.find(p => p.id === product.id);
    if (updatedProduct && updatedProduct.quantity < (JSON.parse(localStorage.getItem('products') || '[]').find((p: any) => p.id === product.id)?.reorderLevel || 0)) {
      addLowStockNotification(updatedProduct);
    }

    closeDialog();
    generateInvoice(newSale);
  };

  const addLowStockNotification = (product: Product) => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const newNotification = {
      id: Date.now().toString(),
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${product.name} stock is running low (${product.quantity} units remaining)`,
      productId: product.id,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  };

  const generateInvoice = (sale: Sale) => {
    // In a real app, this would generate a PDF
    const invoiceData = `
INVOICE
======================================
Invoice #: ${sale.id}
Date: ${new Date(sale.createdAt).toLocaleString()}
Customer: ${sale.customerName}

ITEMS
======================================
${sale.productName}
Quantity: ${sale.quantity} x $${sale.price.toFixed(2)}
Subtotal: $${sale.subtotal.toFixed(2)}
${sale.discount > 0 ? `Discount (${sale.discount}%): -$${sale.discountAmount.toFixed(2)}` : ''}

======================================
TOTAL: $${sale.total.toFixed(2)}
Payment Method: ${sale.paymentMethod.toUpperCase()}

Thank you for your business!
    `;

    console.log(invoiceData);
    alert('Invoice generated! Check console for details. In production, this would generate a PDF.');
  };

  const closeDialog = () => {
    setShowDialog(false);
    setFormData({
      productId: '',
      quantity: '1',
      discount: '0',
      paymentMethod: 'cash',
      customerName: '',
    });
  };

  const selectedProduct = products.find(p => p.id === formData.productId);
  const calculatedSubtotal = selectedProduct 
    ? selectedProduct.price * parseInt(formData.quantity || '0')
    : 0;
  const calculatedDiscount = (calculatedSubtotal * parseFloat(formData.discount || '0')) / 100;
  const calculatedTotal = calculatedSubtotal - calculatedDiscount;

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'upi': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Sales Management</h1>
          <p className="text-gray-600">Process sales and manage transactions</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Sales</p>
              <p className="text-2xl text-gray-900">
                {sales.filter(s => 
                  new Date(s.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
              <p className="text-2xl text-gray-900">
                ${sales.filter(s => 
                  new Date(s.createdAt).toDateString() === new Date().toDateString()
                ).reduce((sum, s) => sum + s.total, 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sales</p>
              <p className="text-2xl text-gray-900">{sales.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search sales by invoice, product, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.slice(0, 50).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-gray-900">{sale.id}</TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{sale.productName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell className="text-gray-900">${sale.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getPaymentMethodColor(sale.paymentMethod)}>
                        {sale.paymentMethod.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateInvoice(sale)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sales found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.quantity > 0).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${product.price.toFixed(2)} ({product.quantity} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct?.quantity || 1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Walk-in Customer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">${calculatedSubtotal.toFixed(2)}</span>
                  </div>
                  {parseFloat(formData.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount ({formData.discount}%):</span>
                      <span className="text-red-600">-${calculatedDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">${calculatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.productId}>
                Complete Sale
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
