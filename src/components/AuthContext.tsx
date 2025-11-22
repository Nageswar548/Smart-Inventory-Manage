import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'manager';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, role: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Initialize demo data
    initializeDemoData();
  }, []);

  const login = (email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      };
      setUser(userSession);
      localStorage.setItem('currentUser', JSON.stringify(userSession));
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, password: string, role: string): boolean => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      return false; // User already exists
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function initializeDemoData() {
  // Initialize demo users if not exists
  if (!localStorage.getItem('users')) {
    const demoUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        id: '2',
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'manager123',
        role: 'manager',
      },
      {
        id: '3',
        name: 'Staff User',
        email: 'staff@example.com',
        password: 'staff123',
        role: 'staff',
      },
    ];
    localStorage.setItem('users', JSON.stringify(demoUsers));
  }

  // Initialize demo products if not exists
  if (!localStorage.getItem('products')) {
    const demoProducts = [
      {
        id: '1',
        name: 'Wireless Mouse',
        sku: 'WM-001',
        price: 29.99,
        quantity: 45,
        reorderLevel: 20,
        supplier: 'TechSupply Co',
        category: 'Electronics',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        name: 'USB-C Cable',
        sku: 'UC-002',
        price: 12.99,
        quantity: 15,
        reorderLevel: 30,
        supplier: 'CableWorld Inc',
        category: 'Accessories',
        createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        name: 'Mechanical Keyboard',
        sku: 'MK-003',
        price: 89.99,
        quantity: 28,
        reorderLevel: 15,
        supplier: 'TechSupply Co',
        category: 'Electronics',
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        name: 'Laptop Stand',
        sku: 'LS-004',
        price: 45.99,
        quantity: 52,
        reorderLevel: 25,
        supplier: 'ErgoTech Ltd',
        category: 'Accessories',
        createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        name: 'Webcam HD',
        sku: 'WC-005',
        price: 65.99,
        quantity: 8,
        reorderLevel: 12,
        supplier: 'VisionTech Inc',
        category: 'Electronics',
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '6',
        name: 'Phone Holder',
        sku: 'PH-006',
        price: 18.99,
        quantity: 67,
        reorderLevel: 20,
        supplier: 'MobileTech Co',
        category: 'Accessories',
        createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    localStorage.setItem('products', JSON.stringify(demoProducts));
  }

  // Initialize demo sales with historical data for AI forecasting
  if (!localStorage.getItem('sales')) {
    const demoSales = generateDemoSales();
    localStorage.setItem('sales', JSON.stringify(demoSales));
  }

  // Initialize notifications
  if (!localStorage.getItem('notifications')) {
    const notifications = [
      {
        id: '1',
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'USB-C Cable stock is below reorder level (15 units remaining)',
        productId: '2',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Webcam HD stock is critically low (8 units remaining)',
        productId: '5',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'restock',
        title: 'AI Restock Suggestion',
        message: 'Recommended to reorder 50 units of Wireless Mouse based on demand forecast',
        productId: '1',
        read: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }
}

function generateDemoSales() {
  const sales = [];
  const products = [
    { id: '1', name: 'Wireless Mouse', price: 29.99 },
    { id: '2', name: 'USB-C Cable', price: 12.99 },
    { id: '3', name: 'Mechanical Keyboard', price: 89.99 },
    { id: '4', name: 'Laptop Stand', price: 45.99 },
    { id: '5', name: 'Webcam HD', price: 65.99 },
    { id: '6', name: 'Phone Holder', price: 18.99 },
  ];

  const paymentMethods = ['cash', 'card', 'upi'];
  
  // Generate sales for the past 90 days
  for (let i = 90; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dailySales = Math.floor(Math.random() * 8) + 3; // 3-10 sales per day

    for (let j = 0; j < dailySales; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 15) + 5 : 0;
      const subtotal = product.price * quantity;
      const discountAmount = (subtotal * discount) / 100;
      const total = subtotal - discountAmount;

      sales.push({
        id: `${Date.now()}-${i}-${j}`,
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        subtotal,
        discount,
        discountAmount,
        total,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        customerName: `Customer ${Math.floor(Math.random() * 100) + 1}`,
        createdAt: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  return sales;
}
