'use client';

import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types/order';
import { useGoogleSheet } from './useGoogleSheet';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { getOrders } = useGoogleSheet();

  const fetchOrders = useCallback(async () => {
    setRefreshing(true);
    const data = await getOrders();
    const seen = new Set<string>();
    const unique = data.filter(o => {
      if (seen.has(o.orderId)) return false;
      seen.add(o.orderId);
      return true;
    });
    setOrders(unique.reverse());
    setRefreshing(false);
  }, [getOrders]);

  const addOrderToState = useCallback((order: Order) => {
    setOrders(prev => prev.some(o => o.orderId === order.orderId) ? prev : [order, ...prev]);
  }, []);

  const updateOrderStatusInState = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.orderId === orderId ? { ...o, status } : o))
    );
  }, []);

  const updateOrderInState = useCallback((updatedOrder: Order) => {
    setOrders(prev =>
      prev.map(o => (o.orderId === updatedOrder.orderId ? updatedOrder : o))
    );
  }, []);

  return { orders, refreshing, fetchOrders, addOrderToState, updateOrderStatusInState, updateOrderInState };
}
